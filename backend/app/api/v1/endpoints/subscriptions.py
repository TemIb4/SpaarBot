# subscriptions.py - ИСПРАВЛЕНО

"""
Subscriptions API Endpoint
Управление подписками пользователя
"""
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, Field, field_validator

from app.db.database import get_db
from app.db.models import Subscription
from app.db.crud import get_user_by_telegram_id

logger = logging.getLogger(__name__)
router = APIRouter()


class SubscriptionCreate(BaseModel):
    """Schema for creating subscription"""
    telegram_id: int
    name: str
    icon: str = "💳"
    amount: float = Field(..., gt=0, description="Subscription amount (must be positive)")
    billing_cycle: str = "monthly"  # monthly, yearly
    next_billing_date: Optional[datetime] = None
    status: str = "active"

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Subscription amount must be positive')
        if v > 1000000:
            raise ValueError('Subscription amount is too large (max: 1,000,000)')
        return v


class SubscriptionUpdate(BaseModel):
    """Schema for updating subscription"""
    name: Optional[str] = None
    icon: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0, description="Subscription amount (must be positive)")
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    status: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Subscription amount must be positive')
        if v is not None and v > 1000000:
            raise ValueError('Subscription amount is too large (max: 1,000,000)')
        return v


class SubscriptionResponse(BaseModel):
    """Schema for subscription response"""
    id: int
    telegram_id: int
    name: str
    icon: str
    amount: float
    billing_cycle: str
    next_billing_date: Optional[datetime]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[SubscriptionResponse])
async def get_subscriptions(
    telegram_id: int = Query(..., description="Telegram user ID"),
    status: Optional[str] = Query(None, description="Filter by status (active/cancelled)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить все подписки пользователя
    """
    try:
        # Проверить существование пользователя
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Построить запрос - ИСПРАВЛЕНО: использую telegram_id
        query = select(Subscription).where(Subscription.telegram_id == telegram_id)

        if status:
            query = query.where(Subscription.status == status)

        # Выполнить запрос
        result = await db.execute(query)
        subscriptions = result.scalars().all()

        logger.info(f"Found {len(subscriptions)} subscriptions for user {telegram_id}")
        return subscriptions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching subscriptions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Создать новую подписку
    """
    try:
        # Проверить пользователя
        user = await get_user_by_telegram_id(db, subscription.telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Создать подписку
        new_subscription = Subscription(
            telegram_id=subscription.telegram_id,
            name=subscription.name,
            service_name=subscription.name,  # Для совместимости
            icon=subscription.icon,
            amount=subscription.amount,
            billing_cycle=subscription.billing_cycle,
            billing_frequency=subscription.billing_cycle,  # Для совместимости
            next_billing_date=subscription.next_billing_date,
            status=subscription.status,
            confirmed=True
        )

        db.add(new_subscription)
        await db.commit()
        await db.refresh(new_subscription)

        logger.info(f"Created subscription {new_subscription.id} for user {subscription.telegram_id}")
        return new_subscription

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


class SubscriptionUpdateRequest(BaseModel):
    """Schema for update request with telegram_id"""
    telegram_id: int
    name: Optional[str] = None
    icon: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0, description="Subscription amount (must be positive)")
    billing_cycle: Optional[str] = None
    next_billing_date: Optional[datetime] = None
    status: Optional[str] = None

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Subscription amount must be positive')
        if v is not None and v > 1000000:
            raise ValueError('Subscription amount is too large (max: 1,000,000)')
        return v


@router.put("/{subscription_id}", response_model=SubscriptionResponse)
async def update_subscription(
    subscription_id: int,
    request: SubscriptionUpdateRequest = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Обновить подписку
    """
    try:
        # Найти подписку
        query = select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.telegram_id == request.telegram_id
        )
        result = await db.execute(query)
        subscription = result.scalar_one_or_none()

        if not subscription:
            raise HTTPException(
                status_code=404,
                detail="Subscription not found or you don't have permission"
            )

        # Обновить поля
        update_data = request.dict(exclude_unset=True, exclude={'telegram_id'})
        for field, value in update_data.items():
            setattr(subscription, field, value)
            # Обновить совместимые поля
            if field == 'name':
                subscription.service_name = value
            elif field == 'billing_cycle':
                subscription.billing_frequency = value

        await db.commit()
        await db.refresh(subscription)

        logger.info(f"Updated subscription {subscription_id}")
        return subscription

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating subscription: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{subscription_id}")
async def delete_subscription(
    subscription_id: int,
    telegram_id: int = Query(..., description="Telegram user ID for verification"),
    db: AsyncSession = Depends(get_db)
):
    """
    Удалить подписку
    """
    try:
        # Проверить существование и владельца
        query = select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.telegram_id == telegram_id
        )
        result = await db.execute(query)
        subscription = result.scalar_one_or_none()

        if not subscription:
            raise HTTPException(
                status_code=404,
                detail="Subscription not found or you don't have permission"
            )

        # Удалить
        await db.execute(
            delete(Subscription).where(Subscription.id == subscription_id)
        )
        await db.commit()

        logger.info(f"Deleted subscription {subscription_id}")
        return {"status": "success", "message": "Subscription deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting subscription: {e}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))