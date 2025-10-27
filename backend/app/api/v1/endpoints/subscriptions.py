"""
Subscriptions API Endpoint
Управление подписками пользователя
"""
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Subscription, User
from app.db.crud import get_user_by_telegram_id

logger = logging.getLogger(__name__)
router = APIRouter()


class SubscriptionCreate(BaseModel):
    """Schema for creating subscription"""
    name: str
    amount: float
    billing_cycle: str  # monthly, yearly, weekly
    next_billing_date: datetime
    category: Optional[str] = None
    is_active: bool = True


class SubscriptionResponse(BaseModel):
    """Schema for subscription response"""
    id: int
    user_id: int
    name: str
    amount: float
    billing_cycle: str
    next_billing_date: datetime
    category: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[SubscriptionResponse])
async def get_subscriptions(
    telegram_id: int = Query(..., description="User's Telegram ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить все подписки пользователя

    Parameters:
    - telegram_id: Telegram ID пользователя
    - is_active: фильтр по статусу (опционально)

    Returns:
    - List[SubscriptionResponse]: список подписок
    """
    try:
        # Найти пользователя
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Построить запрос
        query = select(Subscription).where(Subscription.user_id == user.id)

        if is_active is not None:
            query = query.where(Subscription.is_active == is_active)

        # Выполнить запрос
        result = await db.execute(query)
        subscriptions = result.scalars().all()

        logger.info(f"Found {len(subscriptions)} subscriptions for user {telegram_id}")
        return subscriptions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscriptions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch subscriptions: {str(e)}")


@router.post("/", response_model=SubscriptionResponse)
async def create_subscription(
    telegram_id: int = Query(..., description="User's Telegram ID"),
    subscription: SubscriptionCreate = ...,
    db: AsyncSession = Depends(get_db)
):
    """
    Создать новую подписку

    Parameters:
    - telegram_id: Telegram ID пользователя
    - subscription: данные подписки

    Returns:
    - SubscriptionResponse: созданная подписка
    """
    try:
        # Найти пользователя
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Создать подписку
        new_subscription = Subscription(
            user_id=user.id,
            name=subscription.name,
            amount=subscription.amount,
            billing_cycle=subscription.billing_cycle,
            next_billing_date=subscription.next_billing_date,
            category=subscription.category,
            is_active=subscription.is_active,
            created_at=datetime.now()
        )

        db.add(new_subscription)
        await db.commit()
        await db.refresh(new_subscription)

        logger.info(f"Created subscription {new_subscription.id} for user {telegram_id}")
        return new_subscription

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create subscription: {str(e)}")


@router.patch("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: int,
    telegram_id: int = Query(..., description="User's Telegram ID"),
    subscription: SubscriptionCreate = ...,
    db: AsyncSession = Depends(get_db)
):
    """
    Обновить подписку

    Parameters:
    - subscription_id: ID подписки
    - telegram_id: Telegram ID пользователя
    - subscription: обновленные данные

    Returns:
    - SubscriptionResponse: обновленная подписка
    """
    try:
        # Найти пользователя
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Найти подписку
        result = await db.execute(
            select(Subscription).where(
                Subscription.id == subscription_id,
                Subscription.user_id == user.id
            )
        )
        existing_subscription = result.scalar_one_or_none()

        if not existing_subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")

        # Обновить поля
        existing_subscription.name = subscription.name
        existing_subscription.amount = subscription.amount
        existing_subscription.billing_cycle = subscription.billing_cycle
        existing_subscription.next_billing_date = subscription.next_billing_date
        existing_subscription.category = subscription.category
        existing_subscription.is_active = subscription.is_active

        await db.commit()
        await db.refresh(existing_subscription)

        logger.info(f"Updated subscription {subscription_id} for user {telegram_id}")
        return existing_subscription

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update subscription: {str(e)}")


@router.delete("/{subscription_id}")
async def delete_subscription(
    subscription_id: int,
    telegram_id: int = Query(..., description="User's Telegram ID"),
    db: AsyncSession = Depends(get_db)
):
    """
    Удалить подписку

    Parameters:
    - subscription_id: ID подписки
    - telegram_id: Telegram ID пользователя

    Returns:
    - dict: статус удаления
    """
    try:
        # Найти пользователя
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Найти подписку
        result = await db.execute(
            select(Subscription).where(
                Subscription.id == subscription_id,
                Subscription.user_id == user.id
            )
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")

        # Удалить подписку
        await db.delete(subscription)
        await db.commit()

        logger.info(f"Deleted subscription {subscription_id} for user {telegram_id}")
        return {"status": "success", "message": "Subscription deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting subscription: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete subscription: {str(e)}")