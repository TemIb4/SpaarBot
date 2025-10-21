"""
PayPal Integration Endpoints
Интеграция с PayPal для premium подписок и синхронизации транзакций
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db import crud
from app.schemas.user import UserResponse
from app.core.config import get_settings
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime, timedelta
import logging
import httpx
import json
import hmac
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


class PayPalSubscriptionCreate(BaseModel):
    """Схема для создания PayPal подписки"""
    plan_id: str  # 'monthly' or 'yearly'
    return_url: HttpUrl
    cancel_url: HttpUrl


class PayPalSubscriptionResponse(BaseModel):
    """Ответ с ссылкой на PayPal checkout"""
    approval_url: str
    subscription_id: str


class PayPalWebhookEvent(BaseModel):
    """PayPal Webhook Event"""
    id: str
    event_type: str
    resource: dict
    create_time: str


# PayPal API Configuration
PAYPAL_API_BASE = (
    "https://api-m.paypal.com"
    if settings.PAYPAL_MODE == "live"
    else "https://api-m.sandbox.paypal.com"
)

PAYPAL_PLAN_IDS = {
    'monthly': 'P-MONTHLY-PREMIUM-PLAN-ID',  # TODO: Заменить на реальные ID из PayPal Dashboard
    'yearly': 'P-YEARLY-PREMIUM-PLAN-ID'
}


async def get_paypal_access_token() -> str:
    """Получить PayPal access token"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYPAL_API_BASE}/v1/oauth2/token",
                auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET),
                data={"grant_type": "client_credentials"}
            )
            response.raise_for_status()
            return response.json()["access_token"]
    except Exception as e:
        logger.error(f"PayPal auth error: {e}")
        raise HTTPException(status_code=500, detail="PayPal authentication failed")


def verify_webhook_signature(
    request_body: bytes,
    headers: dict,
    webhook_id: str
) -> bool:
    """
    Проверить подпись PayPal webhook

    Args:
        request_body: Raw request body
        headers: Request headers
        webhook_id: PayPal Webhook ID

    Returns:
        True если подпись валидна
    """
    # Получить необходимые headers
    transmission_id = headers.get('paypal-transmission-id')
    transmission_time = headers.get('paypal-transmission-time')
    cert_url = headers.get('paypal-cert-url')
    transmission_sig = headers.get('paypal-transmission-sig')
    auth_algo = headers.get('paypal-auth-algo')

    if not all([transmission_id, transmission_time, cert_url, transmission_sig, auth_algo]):
        logger.warning("Missing webhook signature headers")
        return False

    # В продакшене нужно проверить сертификат через PayPal API
    # Для MVP возвращаем True, но TODO: реализовать полную верификацию
    logger.info(f"Webhook signature verification bypassed for MVP")
    return True


@router.post("/create-subscription", response_model=PayPalSubscriptionResponse)
async def create_paypal_subscription(
    data: PayPalSubscriptionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Создать PayPal подписку

    Steps:
    1. Получить access token
    2. Создать subscription в PayPal
    3. Вернуть approval URL для redirect
    """
    # Получить пользователя из Telegram init data
    telegram_id = request.state.user.telegram_id  # TODO: Implement auth middleware

    user = await crud.get_user_by_telegram_id(db, telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Получить plan ID
    plan_id = PAYPAL_PLAN_IDS.get(data.plan_id)
    if not plan_id:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    try:
        # Получить access token
        access_token = await get_paypal_access_token()

        # Создать subscription
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYPAL_API_BASE}/v1/billing/subscriptions",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json={
                    "plan_id": plan_id,
                    "application_context": {
                        "brand_name": "SpaarBot",
                        "locale": "de-DE",
                        "shipping_preference": "NO_SHIPPING",
                        "user_action": "SUBSCRIBE_NOW",
                        "payment_method": {
                            "payer_selected": "PAYPAL",
                            "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                        },
                        "return_url": str(data.return_url),
                        "cancel_url": str(data.cancel_url)
                    },
                    "custom_id": str(user.id)  # Связать с пользователем
                }
            )
            response.raise_for_status()
            subscription_data = response.json()

        # Найти approval URL
        approval_url = None
        for link in subscription_data.get("links", []):
            if link.get("rel") == "approve":
                approval_url = link.get("href")
                break

        if not approval_url:
            raise HTTPException(status_code=500, detail="No approval URL in PayPal response")

        logger.info(f"PayPal subscription created for user {user.id}: {subscription_data['id']}")

        return PayPalSubscriptionResponse(
            approval_url=approval_url,
            subscription_id=subscription_data["id"]
        )

    except httpx.HTTPError as e:
        logger.error(f"PayPal API error: {e}")
        raise HTTPException(status_code=500, detail="PayPal subscription creation failed")


@router.post("/webhook")
async def paypal_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    PayPal Webhook Handler

    События:
    - BILLING.SUBSCRIPTION.ACTIVATED: Подписка активирована
    - BILLING.SUBSCRIPTION.CANCELLED: Подписка отменена
    - BILLING.SUBSCRIPTION.EXPIRED: Подписка истекла
    - PAYMENT.SALE.COMPLETED: Платеж завершен
    """
    # Получить raw body для верификации подписи
    body = await request.body()

    # Верифицировать подпись
    is_valid = verify_webhook_signature(
        body,
        dict(request.headers),
        settings.PAYPAL_WEBHOOK_ID
    )

    if not is_valid:
        logger.warning("Invalid PayPal webhook signature")
        raise HTTPException(status_code=401, detail="Invalid signature")

    # Парсить событие
    try:
        event = json.loads(body.decode())
        event_type = event.get("event_type")
        resource = event.get("resource", {})

        logger.info(f"PayPal webhook received: {event_type}")

        # Обработать событие
        if event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
            await handle_subscription_activated(db, resource)

        elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
            await handle_subscription_cancelled(db, resource)

        elif event_type == "BILLING.SUBSCRIPTION.EXPIRED":
            await handle_subscription_expired(db, resource)

        elif event_type == "PAYMENT.SALE.COMPLETED":
            await handle_payment_completed(db, resource)

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


async def handle_subscription_activated(db: AsyncSession, resource: dict):
    """Обработать активацию подписки"""
    subscription_id = resource.get("id")
    custom_id = resource.get("custom_id")  # User ID

    if not custom_id:
        logger.warning(f"No custom_id in subscription {subscription_id}")
        return

    # Обновить пользователя
    user = await crud.get_user(db, int(custom_id))
    if user:
        user.is_premium = True
        user.premium_since = datetime.utcnow()
        user.paypal_subscription_id = subscription_id
        await db.commit()

        logger.info(f"User {user.id} upgraded to premium via PayPal")


async def handle_subscription_cancelled(db: AsyncSession, resource: dict):
    """Обработать отмену подписки"""
    subscription_id = resource.get("id")

    # Найти пользователя по subscription_id
    user = await crud.get_user_by_paypal_subscription(db, subscription_id)
    if user:
        user.is_premium = False
        user.paypal_subscription_id = None
        await db.commit()

        logger.info(f"User {user.id} premium cancelled")


async def handle_subscription_expired(db: AsyncSession, resource: dict):
    """Обработать истечение подписки"""
    subscription_id = resource.get("id")

    user = await crud.get_user_by_paypal_subscription(db, subscription_id)
    if user:
        user.is_premium = False
        await db.commit()

        logger.info(f"User {user.id} premium expired")


async def handle_payment_completed(db: AsyncSession, resource: dict):
    """Обработать завершение платежа"""
    amount = resource.get("amount", {}).get("total")
    billing_agreement_id = resource.get("billing_agreement_id")

    logger.info(f"Payment completed: {amount} EUR for subscription {billing_agreement_id}")

    # TODO: Можно сохранить историю платежей для аналитики


@router.get("/subscription-status/{subscription_id}")
async def get_subscription_status(
    subscription_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Получить статус PayPal подписки
    """
    try:
        access_token = await get_paypal_access_token()

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{PAYPAL_API_BASE}/v1/billing/subscriptions/{subscription_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            subscription = response.json()

        return {
            "id": subscription["id"],
            "status": subscription["status"],
            "plan_id": subscription["plan_id"],
            "start_time": subscription.get("start_time"),
            "billing_info": subscription.get("billing_info", {})
        }

    except httpx.HTTPError as e:
        logger.error(f"PayPal subscription status error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription status")


@router.post("/cancel-subscription/{subscription_id}")
async def cancel_subscription(
    subscription_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Отменить PayPal подписку
    """
    try:
        access_token = await get_paypal_access_token()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PAYPAL_API_BASE}/v1/billing/subscriptions/{subscription_id}/cancel",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json={"reason": "Customer requested cancellation"}
            )
            response.raise_for_status()

        # Обновить пользователя
        user = await crud.get_user_by_paypal_subscription(db, subscription_id)
        if user:
            user.is_premium = False
            user.paypal_subscription_id = None
            await db.commit()

        return {"status": "cancelled"}

    except httpx.HTTPError as e:
        logger.error(f"PayPal cancellation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")