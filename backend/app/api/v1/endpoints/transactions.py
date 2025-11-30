# backend/app/api/v1/endpoints/transactions.py - ИСПРАВЛЕННЫЙ GET ENDPOINT

"""
Transaction Endpoints - С EAGER LOADING
"""
import logging
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload  # ← ДОБАВЛЕНО!

from app.db.database import get_db
from app.db.models import Transaction  # ← ДОБАВЛЕНО!
from app.db.crud import (
    get_user_by_telegram_id,
    create_transaction,
    get_category_by_name,
    get_default_categories,
    create_unconfirmed_subscription
)
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
)
from app.services.categorization_service import categorization_service

logger = logging.getLogger(__name__)
router = APIRouter()


# ... (add_transaction остается прежним)


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
        telegram_id: int = Query(...),
        start_date: Optional[str] = Query(None),
        end_date: Optional[str] = Query(None),
        transaction_type: Optional[str] = Query(None),
        limit: int = Query(100, le=1000),
        db: AsyncSession = Depends(get_db)
):
    """Получить все транзакции - С EAGER LOADING"""
    try:
        # ИСПРАВЛЕНО: Собственный запрос с eager loading
        query = select(Transaction).where(
            Transaction.telegram_id == telegram_id
        ).options(
            selectinload(Transaction.category)  # ← ЗАГРУЖАЕМ КАТЕГОРИЮ СРАЗУ!
        )

        # Фильтры
        if start_date:
            start = datetime.fromisoformat(start_date).date()
            query = query.where(Transaction.transaction_date >= start)

        if end_date:
            end = datetime.fromisoformat(end_date).date()
            query = query.where(Transaction.transaction_date <= end)

        if transaction_type:
            query = query.where(Transaction.transaction_type == transaction_type)

        # Сортировка и лимит
        query = query.order_by(Transaction.transaction_date.desc()).limit(limit)

        # Выполнить запрос
        result = await db.execute(query)
        transactions = result.scalars().all()

        # ИСПРАВЛЕНО: Теперь t.category уже загружена!
        return [
            TransactionResponse(
                id=t.id,
                telegram_id=t.telegram_id,
                amount=float(t.amount),
                description=t.description or "",
                category=t.category.name if t.category else None,
                category_id=t.category_id,
                transaction_type=t.transaction_type,
                transaction_date=t.transaction_date if t.transaction_date else date.today(),
                created_at=t.created_at if t.created_at else datetime.now()
            )
            for t in transactions
        ]

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/expenses", response_model=List[TransactionResponse])
async def get_expenses(
        telegram_id: int = Query(...),
        start_date: Optional[str] = Query(None),
        end_date: Optional[str] = Query(None),
        category_id: Optional[int] = Query(None),
        limit: int = Query(100, le=1000),
        db: AsyncSession = Depends(get_db)
):
    """Получить расходы - С EAGER LOADING"""
    try:
        # ИСПРАВЛЕНО: Собственный запрос
        query = select(Transaction).where(
            Transaction.telegram_id == telegram_id,
            Transaction.transaction_type == 'expense'
        ).options(
            selectinload(Transaction.category)
        )

        if start_date:
            start = datetime.fromisoformat(start_date).date()
            query = query.where(Transaction.transaction_date >= start)

        if end_date:
            end = datetime.fromisoformat(end_date).date()
            query = query.where(Transaction.transaction_date <= end)

        if category_id:
            query = query.where(Transaction.category_id == category_id)

        query = query.order_by(Transaction.transaction_date.desc()).limit(limit)

        result = await db.execute(query)
        transactions = result.scalars().all()

        return [
            TransactionResponse(
                id=t.id,
                telegram_id=t.telegram_id,
                amount=float(t.amount),
                description=t.description or "",
                category=t.category.name if t.category else None,
                category_id=t.category_id,
                transaction_type=t.transaction_type,
                transaction_date=t.transaction_date if t.transaction_date else date.today(),
                created_at=t.created_at if t.created_at else datetime.now()
            )
            for t in transactions
        ]

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ИСПРАВЛЕННЫЙ analytics endpoint
@router.get("/analytics/by-category")
async def get_category_analytics(
        telegram_id: int = Query(...),
        start_date: Optional[str] = Query(None),
        end_date: Optional[str] = Query(None),
        db: AsyncSession = Depends(get_db)
):
    """Получить аналитику по категориям - С EAGER LOADING"""
    try:
        # ИСПРАВЛЕНО: Собственный запрос
        query = select(Transaction).where(
            Transaction.telegram_id == telegram_id,
            Transaction.transaction_type == 'expense'
        ).options(
            selectinload(Transaction.category)
        )

        if start_date:
            start = datetime.fromisoformat(start_date).date()
            query = query.where(Transaction.transaction_date >= start)

        if end_date:
            end = datetime.fromisoformat(end_date).date()
            query = query.where(Transaction.transaction_date <= end)

        result = await db.execute(query)
        transactions = result.scalars().all()

        # Группировка по категориям
        category_totals = {}
        total_expenses = 0

        for t in transactions:
            if t.category:  # Теперь category уже загружена!
                cat_name = t.category.name
                if cat_name not in category_totals:
                    category_totals[cat_name] = {
                        'total': 0,
                        'icon': t.category.icon,
                        'color': t.category.color,
                        'count': 0
                    }
                category_totals[cat_name]['total'] += float(t.amount)
                category_totals[cat_name]['count'] += 1
                total_expenses += float(t.amount)

        result_list = []
        for name, data in category_totals.items():
            percentage = (data['total'] / total_expenses * 100) if total_expenses > 0 else 0
            result_list.append({
                'name': name,
                'total': round(data['total'], 2),
                'percentage': round(percentage, 1),
                'count': data['count'],
                'icon': data['icon'],
                'color': data['color']
            })

        result_list.sort(key=lambda x: x['total'], reverse=True)

        return {
            'total_expenses': round(total_expenses, 2),
            'categories': result_list
        }

    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Остальные endpoints без изменений...

@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Получить список всех доступных категорий"""
    try:
        categories = await get_default_categories(db)
        return [
            {
                'id': cat.id,
                'name': cat.name,
                'icon': cat.icon,
                'color': cat.color,
                'type': cat.category_type
            }
            for cat in categories
        ]
    except Exception as e:
        logger.error(f"Error getting categories: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{transaction_id}")
async def delete_transaction(
        transaction_id: int,
        telegram_id: int = Query(...),
        db: AsyncSession = Depends(get_db)
):
    """Удалить транзакцию"""
    try:
        from sqlalchemy import delete

        result = await db.execute(
            select(Transaction).where(
                Transaction.id == transaction_id,
                Transaction.telegram_id == telegram_id
            )
        )
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found or you don't have permission"
            )

        await db.execute(
            delete(Transaction).where(Transaction.id == transaction_id)
        )
        await db.commit()

        return {"status": "success", "message": "Transaction deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting transaction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))