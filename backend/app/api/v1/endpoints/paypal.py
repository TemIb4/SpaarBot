"""
PayPal API Endpoints - Extended
Complete subscription management and webhooks
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import logging

from app.db.database import get_db
from app.db.models import User
from app.services.paypal_service import paypal_service
from app.core.config import get_settings
from sqlalchemy import select

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()


# ============================================================================
# SCHEMAS
# ============================================================================

class CreateSubscriptionRequest(BaseModel):
    telegram_id: int
    return_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CancelSubscriptionRequest(BaseModel):
    telegram_id: int
    reason: Optional[str] = "User requested cancellation"


class SubscriptionStatusRequest(BaseModel):
    telegram_id: int


# ============================================================================
# SUBSCRIPTION ENDPOINTS
# ============================================================================

@router.post("/create-subscription")
async def create_subscription(
    request: CreateSubscriptionRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create PayPal subscription for user

    Flow:
    1. Check if user already has active subscription
    2. Create subscription with PayPal
    3. Return approval URL for user to complete payment
    """
    try:
        # Get user
        result = await db.execute(
            select(User).where(User.telegram_id == request.telegram_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check existing subscription
        if user.is_premium and user.paypal_subscription_id:
            # Verify with PayPal
            subscription_details = paypal_service.get_subscription_details(
                user.paypal_subscription_id
            )

            if subscription_details.get('success'):
                subscription = subscription_details['subscription']
                if subscription['status'] in ['ACTIVE', 'APPROVED']:
                    return {
                        "success": False,
                        "error": "User already has active subscription",
                        "subscription_id": user.paypal_subscription_id
                    }

        # Set default URLs
        return_url = request.return_url or f"{settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')}/app/subscription-success"
        cancel_url = request.cancel_url or f"{settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')}/app/subscription-cancelled"

        # Create subscription with PayPal
        result = paypal_service.create_subscription(
            return_url=return_url,
            cancel_url=cancel_url,
            custom_id=str(request.telegram_id)
        )

        if not result.get('success'):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create subscription: {result.get('error')}"
            )

        logger.info(f"Subscription created for user {request.telegram_id}: {result['subscription_id']}")

        return {
            "success": True,
            "subscription_id": result['subscription_id'],
            "approval_url": result['approval_url'],
            "status": result['status']
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscription-success")
async def handle_subscription_success(
    subscription_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle successful subscription approval from PayPal
    User is redirected here after approving subscription
    """
    try:
        # Get subscription details from PayPal
        subscription_details = paypal_service.get_subscription_details(subscription_id)

        if not subscription_details.get('success'):
            raise HTTPException(status_code=400, detail="Invalid subscription")

        subscription = subscription_details['subscription']

        # Extract custom_id (telegram_id)
        custom_id = subscription.get('custom_id')
        if not custom_id:
            raise HTTPException(status_code=400, detail="Missing user information")

        telegram_id = int(custom_id)

        # Get user
        result = await db.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Update user premium status
        user.is_premium = True
        user.paypal_subscription_id = subscription_id
        user.premium_since = datetime.now()

        await db.commit()

        logger.info(f"Premium activated for user {telegram_id}")

        # Send notification to user via Telegram
        from aiogram import Bot
        bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

        await bot.send_message(
            chat_id=telegram_id,
            text="🎉 <b>Premium aktiviert!</b>\n\nDu hast jetzt Zugriff auf alle Premium-Features:\n• Unbegrenzte Transaktionen\n• AI-Insights\n• OCR für Belege\n• Bank-Integration",
            parse_mode='HTML'
        )

        return {
            "success": True,
            "message": "Premium subscription activated",
            "subscription_id": subscription_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling subscription success: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cancel-subscription")
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Cancel user's PayPal subscription"""
    try:
        # Get user
        result = await db.execute(
            select(User).where(User.telegram_id == request.telegram_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.paypal_subscription_id:
            raise HTTPException(status_code=400, detail="No active subscription found")

        # Cancel subscription with PayPal
        cancel_result = paypal_service.cancel_subscription(
            user.paypal_subscription_id,
            request.reason
        )

        if not cancel_result.get('success'):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to cancel subscription: {cancel_result.get('error')}"
            )

        # Update user status
        user.is_premium = False
        await db.commit()

        logger.info(f"Subscription cancelled for user {request.telegram_id}")

        return {
            "success": True,
            "message": "Subscription cancelled successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/subscription-status")
async def get_subscription_status(
    request: SubscriptionStatusRequest,
    db: AsyncSession = Depends(get_db)
):
    """Get current subscription status for user"""
    try:
        # Get user
        result = await db.execute(
            select(User).where(User.telegram_id == request.telegram_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.paypal_subscription_id:
            return {
                "success": True,
                "is_premium": False,
                "subscription_id": None,
                "status": "none"
            }

        # Get subscription details from PayPal
        subscription_details = paypal_service.get_subscription_details(
            user.paypal_subscription_id
        )

        if not subscription_details.get('success'):
            return {
                "success": True,
                "is_premium": user.is_premium,
                "subscription_id": user.paypal_subscription_id,
                "status": "unknown",
                "error": subscription_details.get('error')
            }

        subscription = subscription_details['subscription']

        return {
            "success": True,
            "is_premium": user.is_premium,
            "subscription_id": user.paypal_subscription_id,
            "status": subscription['status'],
            "plan_id": subscription.get('plan_id'),
            "start_time": subscription.get('start_time'),
            "billing_info": subscription.get('billing_info')
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WEBHOOK ENDPOINT
# ============================================================================

@router.post("/webhook")
async def paypal_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle PayPal webhook events

    Events:
    - BILLING.SUBSCRIPTION.ACTIVATED
    - BILLING.SUBSCRIPTION.CANCELLED
    - BILLING.SUBSCRIPTION.SUSPENDED
    - PAYMENT.SALE.COMPLETED
    """
    try:
        # Get webhook event
        webhook_event = await request.json()
        headers = dict(request.headers)

        logger.info(f"Received PayPal webhook: {webhook_event.get('event_type')}")

        # Verify webhook signature (in production)
        if settings.ENVIRONMENT == 'production' and settings.PAYPAL_WEBHOOK_ID:
            is_valid = paypal_service.verify_webhook_signature(
                headers,
                settings.PAYPAL_WEBHOOK_ID,
                webhook_event
            )

            if not is_valid:
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=400, detail="Invalid signature")

        # Process event
        event_type = webhook_event.get('event_type')

        if event_type == 'BILLING.SUBSCRIPTION.ACTIVATED':
            await handle_subscription_activated(webhook_event, db)

        elif event_type == 'BILLING.SUBSCRIPTION.CANCELLED':
            await handle_subscription_cancelled(webhook_event, db)

        elif event_type == 'BILLING.SUBSCRIPTION.SUSPENDED':
            await handle_subscription_suspended(webhook_event, db)

        elif event_type == 'PAYMENT.SALE.COMPLETED':
            await handle_payment_completed(webhook_event, db)

        return {"success": True, "event_type": event_type}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WEBHOOK HANDLERS
# ============================================================================

async def handle_subscription_activated(webhook_event: dict, db: AsyncSession):
    """Handle subscription activation"""
    try:
        subscription_id = webhook_event['resource']['id']
        custom_id = webhook_event['resource'].get('custom_id')

        if not custom_id:
            logger.warning(f"No custom_id in subscription activation: {subscription_id}")
            return

        telegram_id = int(custom_id)

        # Update user
        result = await db.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        user = result.scalar_one_or_none()

        if user:
            user.is_premium = True
            user.paypal_subscription_id = subscription_id
            user.premium_since = datetime.now()
            await db.commit()

            logger.info(f"Subscription activated via webhook for user {telegram_id}")

    except Exception as e:
        logger.error(f"Error handling subscription activation: {e}")


async def handle_subscription_cancelled(webhook_event: dict, db: AsyncSession):
    """Handle subscription cancellation"""
    try:
        subscription_id = webhook_event['resource']['id']

        # Find user by subscription_id
        result = await db.execute(
            select(User).where(User.paypal_subscription_id == subscription_id)
        )
        user = result.scalar_one_or_none()

        if user:
            user.is_premium = False
            await db.commit()

            logger.info(f"Subscription cancelled via webhook for user {user.telegram_id}")

            # Notify user
            from aiogram import Bot
            bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

            await bot.send_message(
                chat_id=user.telegram_id,
                text="ℹ️ Dein Premium-Abonnement wurde gekündigt. Du kannst noch bis zum Ende des Abrechnungszeitraums alle Premium-Features nutzen.",
                parse_mode='HTML'
            )

    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {e}")


async def handle_subscription_suspended(webhook_event: dict, db: AsyncSession):
    """Handle subscription suspension"""
    try:
        subscription_id = webhook_event['resource']['id']

        # Find user
        result = await db.execute(
            select(User).where(User.paypal_subscription_id == subscription_id)
        )
        user = result.scalar_one_or_none()

        if user:
            user.is_premium = False
            await db.commit()

            logger.info(f"Subscription suspended via webhook for user {user.telegram_id}")

            # Notify user
            from aiogram import Bot
            bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)

            await bot.send_message(
                chat_id=user.telegram_id,
                text="⚠️ Dein Premium-Abonnement wurde ausgesetzt. Bitte überprüfe deine Zahlungsmethode.",
                parse_mode='HTML'
            )

    except Exception as e:
        logger.error(f"Error handling subscription suspension: {e}")


async def handle_payment_completed(webhook_event: dict, db: AsyncSession):
    """Handle completed payment"""
    try:
        logger.info("Payment completed webhook received")
        # Additional payment processing logic if needed

    except Exception as e:
        logger.error(f"Error handling payment completion: {e}")