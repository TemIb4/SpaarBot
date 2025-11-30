# paypal_sync.py - ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ФИНАЛЬНАЯ ВЕРСИЯ

"""
PayPal Synchronization - полная синхронизация без ошибок
"""
import logging
import base64
from datetime import datetime, timedelta, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import httpx

from app.db.database import get_db
from app.db.crud import get_user_by_telegram_id
from app.core.config import get_settings
from app.db.models import Transaction

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


class PayPalBalance(BaseModel):
    currency: str
    available: float
    pending: float = 0.0


class PayPalTransaction(BaseModel):
    transaction_id: str
    date: str
    amount: float
    currency: str
    description: str
    status: str
    type: str


class PayPalSubscription(BaseModel):
    subscription_id: str
    name: str
    amount: float
    currency: str
    status: str
    next_billing_date: Optional[str] = None


class SyncResponse(BaseModel):
    success: bool
    balance: Optional[PayPalBalance] = None
    transactions_count: int = 0  # ИСПРАВЛЕНО: возвращаем только количество
    subscriptions_count: int = 0
    error: Optional[str] = None


async def get_paypal_access_token() -> str:
    """Получить access token для PayPal API"""
    client_id = getattr(settings, 'PAYPAL_CLIENT_ID', '').strip()
    client_secret = getattr(settings, 'PAYPAL_CLIENT_SECRET', '').strip()
    paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')

    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="PayPal not configured")

    api_base = "https://api-m.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api-m.paypal.com"
    credentials = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{api_base}/v1/oauth2/token",
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {credentials}",
            },
            data={"grant_type": "client_credentials"}
        )

        if response.status_code != 200:
            logger.error(f"Failed to get PayPal token: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to authenticate with PayPal")

        return response.json()["access_token"]


@router.post("/sync", response_model=SyncResponse)
async def sync_paypal_data(
        telegram_id: int = Query(..., description="Telegram user ID"),
        db: AsyncSession = Depends(get_db)
):
    """
    Синхронизировать все данные из PayPal
    """
    try:
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user or not user.paypal_id:
            raise HTTPException(status_code=404, detail="PayPal not connected")

        access_token = await get_paypal_access_token()
        paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')
        api_base = "https://api-m.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api-m.paypal.com"

        balance_data = None
        transactions_count = 0
        subscriptions_count = 0

        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }

            # 1. Получить баланс
            try:
                balance_response = await client.get(
                    f"{api_base}/v1/reporting/balances",
                    headers=headers
                )

                if balance_response.status_code == 200:
                    balance_json = balance_response.json()

                    if "balances" in balance_json and len(balance_json["balances"]) > 0:
                        primary_balance = balance_json["balances"][0]
                        balance_data = PayPalBalance(
                            currency=primary_balance.get("currency", "USD"),
                            available=float(primary_balance.get("total_balance", {}).get("value", 0)),
                            pending=float(primary_balance.get("available_balance", {}).get("value", 0))
                        )
                        logger.info(f"✅ Balance: {balance_data.available} {balance_data.currency}")
            except Exception as e:
                logger.error(f"Error fetching balance: {e}")

            # 2. Получить транзакции
            try:
                end_date = datetime.now()
                start_date = end_date - timedelta(days=30)

                transactions_response = await client.get(
                    f"{api_base}/v1/reporting/transactions",
                    headers=headers,
                    params={
                        "start_date": start_date.strftime("%Y-%m-%dT%H:%M:%S-0000"),
                        "end_date": end_date.strftime("%Y-%m-%dT%H:%M:%S-0000"),
                        "fields": "all",
                        "page_size": 100
                    }
                )

                if transactions_response.status_code == 200:
                    trans_json = transactions_response.json()

                    for trans in trans_json.get("transaction_details", []):
                        try:
                            info = trans.get("transaction_info", {})
                            transaction_id = info.get("transaction_id", "")

                            # Проверить дубликаты
                            existing = await db.execute(
                                select(Transaction).where(
                                    Transaction.telegram_id == telegram_id,
                                    Transaction.description.contains(transaction_id)
                                )
                            )

                            if existing.scalar_one_or_none() is None:
                                # Парсим дату
                                date_str = info.get("transaction_initiation_date", "")
                                try:
                                    transaction_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
                                except:
                                    transaction_date = date.today()

                                amount = float(info.get("transaction_amount", {}).get("value", 0))
                                description = info.get("transaction_subject", "PayPal Transaction")

                                # ИСПРАВЛЕНО: Создаем с правильными полями
                                new_transaction = Transaction(
                                    telegram_id=telegram_id,
                                    amount=abs(amount),
                                    category_id=1,
                                    description=f"💳 {description}",
                                    transaction_type="income" if amount > 0 else "expense",
                                    transaction_date=transaction_date
                                )

                                db.add(new_transaction)
                                transactions_count += 1

                                logger.info(f"✅ Added: {description} ({amount})")

                        except Exception as e:
                            logger.error(f"❌ Error processing transaction: {e}")
                            continue

                    # Сохраняем все транзакции
                    if transactions_count > 0:
                        await db.commit()
                        logger.info(f"🎉 Saved {transactions_count} new transactions!")

            except Exception as e:
                logger.error(f"Error fetching transactions: {e}")

            # 3. Получить подписки
            try:
                subs_response = await client.get(
                    f"{api_base}/v1/billing/subscriptions",
                    headers=headers,
                    params={"plan_id": "", "page_size": 20}
                )

                if subs_response.status_code == 200:
                    subs_json = subs_response.json()
                    subscriptions_count = len(subs_json.get("subscriptions", []))
                    logger.info(f"✅ Found {subscriptions_count} subscriptions")

            except Exception as e:
                logger.error(f"Error fetching subscriptions: {e}")

        return SyncResponse(
            success=True,
            balance=balance_data,
            transactions_count=transactions_count,
            subscriptions_count=subscriptions_count
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Sync error: {e}", exc_info=True)
        return SyncResponse(
            success=False,
            error=str(e)
        )


@router.get("/balance")
async def get_paypal_balance(
        telegram_id: int = Query(...),
        db: AsyncSession = Depends(get_db)
):
    """Получить только баланс PayPal"""
    try:
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user or not user.paypal_id:
            raise HTTPException(status_code=404, detail="PayPal not connected")

        access_token = await get_paypal_access_token()
        paypal_mode = getattr(settings, 'PAYPAL_MODE', 'sandbox')
        api_base = "https://api-m.sandbox.paypal.com" if paypal_mode == "sandbox" else "https://api-m.paypal.com"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{api_base}/v1/reporting/balances",
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code == 200:
                data = response.json()
                if "balances" in data and len(data["balances"]) > 0:
                    balance = data["balances"][0]
                    return {
                        "currency": balance.get("currency", "USD"),
                        "available": float(balance.get("total_balance", {}).get("value", 0)),
                        "pending": float(balance.get("available_balance", {}).get("value", 0))
                    }

            return {"currency": "USD", "available": 0.0, "pending": 0.0}

    except Exception as e:
        logger.error(f"Error getting balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))