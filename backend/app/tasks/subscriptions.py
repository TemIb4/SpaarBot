"""
Celery Tasks for Subscriptions
Subscription renewal reminders and management
"""
import logging
from datetime import datetime, timedelta, date
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, and_
from aiogram import Bot

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.db.models import User, Subscription

logger = logging.getLogger(__name__)
settings = get_settings()

# Create async engine for tasks
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Initialize bot
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)


@celery_app.task(name='app.tasks.subscriptions.check_subscription_renewals')
def check_subscription_renewals():
    """
    Check for upcoming subscription renewals and send reminders
    Runs daily at 10:00 AM
    """
    import asyncio

    async def _check_renewals():
        async with AsyncSessionLocal() as db:
            try:
                # Get subscriptions due in the next 3 days
                today = date.today()
                three_days_later = today + timedelta(days=3)

                result = await db.execute(
                    select(Subscription)
                    .join(User, User.telegram_id == Subscription.telegram_id)
                    .where(
                        and_(
                            Subscription.status == 'active',
                            Subscription.next_billing_date >= today,
                            Subscription.next_billing_date <= three_days_later
                        )
                    )
                )
                upcoming_subscriptions = result.scalars().all()

                logger.info(f"Found {len(upcoming_subscriptions)} subscriptions due for renewal")

                sent_count = 0
                error_count = 0

                for subscription in upcoming_subscriptions:
                    try:
                        # Get user
                        user_result = await db.execute(
                            select(User).where(User.telegram_id == subscription.telegram_id)
                        )
                        user = user_result.scalar_one_or_none()

                        if not user:
                            continue

                        # Calculate days until renewal
                        days_until = (subscription.next_billing_date.date() - today).days

                        # Send reminder
                        message = format_renewal_reminder(
                            subscription,
                            days_until,
                            user.language or 'de'
                        )

                        await bot.send_message(
                            chat_id=subscription.telegram_id,
                            text=message,
                            parse_mode='HTML'
                        )

                        sent_count += 1
                        logger.info(f"Renewal reminder sent for subscription {subscription.id}")

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error sending reminder for subscription {subscription.id}: {e}")

                logger.info(f"Renewal reminders completed: {sent_count} sent, {error_count} errors")
                return {"sent": sent_count, "errors": error_count}

            except Exception as e:
                logger.error(f"Error in check_subscription_renewals: {e}")
                return {"sent": 0, "errors": 1}

    return asyncio.run(_check_renewals())


@celery_app.task(name='app.tasks.subscriptions.detect_new_subscriptions')
def detect_new_subscriptions():
    """
    Detect potential new subscriptions from recurring transactions
    Premium feature
    """
    import asyncio

    async def _detect_subscriptions():
        async with AsyncSessionLocal() as db:
            try:
                # Get all premium users
                result = await db.execute(
                    select(User).where(User.is_premium == True)
                )
                users = result.scalars().all()

                logger.info(f"Checking for new subscriptions for {len(users)} premium users")

                detected_count = 0
                error_count = 0

                for user in users:
                    try:
                        # Detect recurring transactions
                        from app.services.subscription_detection_service import detect_recurring_transactions

                        new_subscriptions = await detect_recurring_transactions(
                            user.telegram_id,
                            db
                        )

                        if new_subscriptions:
                            # Send notification
                            message = format_new_subscription_notification(
                                new_subscriptions,
                                user.language or 'de'
                            )

                            await bot.send_message(
                                chat_id=user.telegram_id,
                                text=message,
                                parse_mode='HTML'
                            )

                            detected_count += len(new_subscriptions)
                            logger.info(
                                f"Detected {len(new_subscriptions)} new subscriptions for user {user.telegram_id}")

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error detecting subscriptions for {user.telegram_id}: {e}")

                logger.info(f"Subscription detection completed: {detected_count} detected, {error_count} errors")
                return {"detected": detected_count, "errors": error_count}

            except Exception as e:
                logger.error(f"Error in detect_new_subscriptions: {e}")
                return {"detected": 0, "errors": 1}

    return asyncio.run(_detect_subscriptions())


@celery_app.task(name='app.tasks.subscriptions.check_premium_status')
def check_premium_status():
    """
    Check and update premium subscription status
    Verify with PayPal API
    """
    import asyncio

    async def _check_status():
        async with AsyncSessionLocal() as db:
            try:
                # Get all users with PayPal subscriptions
                result = await db.execute(
                    select(User).where(
                        and_(
                            User.is_premium == True,
                            User.paypal_subscription_id.isnot(None)
                        )
                    )
                )
                users = result.scalars().all()

                logger.info(f"Checking premium status for {len(users)} users")

                from app.services.paypal_service import paypal_service

                updated_count = 0
                error_count = 0

                for user in users:
                    try:
                        # Check subscription status with PayPal
                        subscription_details = paypal_service.get_subscription_details(
                            user.paypal_subscription_id
                        )

                        if subscription_details.get('success'):
                            subscription = subscription_details['subscription']
                            paypal_status = subscription['status']

                            # Update user status if needed
                            if paypal_status in ['CANCELLED', 'SUSPENDED', 'EXPIRED']:
                                if user.is_premium:
                                    user.is_premium = False
                                    await db.commit()

                                    # Notify user
                                    await bot.send_message(
                                        chat_id=user.telegram_id,
                                        text="⚠️ Your premium subscription has been cancelled.",
                                        parse_mode='HTML'
                                    )

                                    updated_count += 1
                                    logger.info(f"Deactivated premium for user {user.telegram_id}")

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error checking premium status for {user.telegram_id}: {e}")

                logger.info(f"Premium status check completed: {updated_count} updated, {error_count} errors")
                return {"updated": updated_count, "errors": error_count}

            except Exception as e:
                logger.error(f"Error in check_premium_status: {e}")
                return {"updated": 0, "errors": 1}

    return asyncio.run(_check_status())


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def format_renewal_reminder(
        subscription: Subscription,
        days_until: int,
        language: str = 'de'
) -> str:
    """Format subscription renewal reminder"""

    if language == 'de':
        if days_until == 0:
            time_text = "heute"
        elif days_until == 1:
            time_text = "morgen"
        else:
            time_text = f"in {days_until} Tagen"

        message = f"""🔔 <b>Abonnement-Erinnerung</b>

💳 <b>{subscription.name}</b>
💰 Betrag: €{float(subscription.amount):.2f}
📅 Nächste Zahlung: {time_text}

Stelle sicher, dass genug Guthaben auf deinem Konto ist!

Abonnement verwalten: /subscriptions"""

        return message

    elif language == 'en':
        if days_until == 0:
            time_text = "today"
        elif days_until == 1:
            time_text = "tomorrow"
        else:
            time_text = f"in {days_until} days"

        message = f"""🔔 <b>Subscription Reminder</b>

💳 <b>{subscription.name}</b>
💰 Amount: €{float(subscription.amount):.2f}
📅 Next payment: {time_text}

Make sure you have enough balance in your account!

Manage subscriptions: /subscriptions"""

        return message

    # Default to German
    return format_renewal_reminder(subscription, days_until, 'de')


def format_new_subscription_notification(
        subscriptions: List,
        language: str = 'de'
) -> str:
    """Format new subscription detection notification"""

    if language == 'de':
        message = "🔍 <b>Neue Abonnements erkannt!</b>\n\n"
        message += "Wir haben folgende wiederkehrende Zahlungen gefunden:\n\n"

        for sub in subscriptions[:5]:
            message += f"💳 {sub['name']}\n"
            message += f"💰 €{sub['amount']:.2f} / {sub['frequency']}\n\n"

        message += "Möchtest du diese als Abonnements hinzufügen?\n"
        message += "Gehe zu /subscriptions um sie zu verwalten."

        return message

    # Default to German
    return format_new_subscription_notification(subscriptions, 'de')