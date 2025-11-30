# backend/app/api/v1/endpoints/accounts.py - НОВЫЙ ФАЙЛ

"""
Connected Accounts API
Управление подключенными счетами (PayPal, банки)
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.database import get_db
from app.db.crud import get_user_by_telegram_id

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectedAccount(BaseModel):
    """Подключенный аккаунт"""
    id: str
    type: str  # "paypal", "bank"
    email: Optional[str] = None
    name: Optional[str] = None
    is_default: bool = False
    connected_at: Optional[str] = None


class AccountsResponse(BaseModel):
    """Список подключенных аккаунтов"""
    accounts: List[ConnectedAccount]
    total: int


@router.get("/", response_model=AccountsResponse)
async def get_connected_accounts(
    telegram_id: int = Query(..., description="Telegram user ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить список подключенных аккаунтов
    """
    try:
        # Получить пользователя
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        accounts = []

        # Проверить PayPal
        if user.paypal_id:
            accounts.append(ConnectedAccount(
                id=f"paypal_{telegram_id}",
                type="paypal",
                email=user.paypal_id,
                name="PayPal",
                is_default=True,
                connected_at=user.updated_at.isoformat() if user.updated_at else None
            ))

        logger.info(f"✅ Found {len(accounts)} connected accounts for user {telegram_id}")

        return AccountsResponse(
            accounts=accounts,
            total=len(accounts)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting accounts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/paypal")
async def get_paypal_account(
    telegram_id: int = Query(..., description="Telegram user ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить информацию о PayPal аккаунте
    """
    try:
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.paypal_id:
            return {
                "connected": False,
                "email": None
            }

        return {
            "connected": True,
            "email": user.paypal_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting PayPal account: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))