"""
Transaction Endpoints
"""
import logging
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.crud import (
    get_user_by_telegram_id,
    create_transaction,
    get_user_transactions,
    get_transactions_by_category,
    get_category_by_name,
    get_default_categories
)
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
    CategoryBreakdown
)
from app.services.groq_service import categorize_transaction  # ✅ Теперь должно работать

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=TransactionResponse)
async def add_transaction(transaction: TransactionCreate):
    """Add a new transaction"""
    try:
        async for db in get_db():
            # Verify user exists
            user = await get_user_by_telegram_id(db, transaction.telegram_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Create transaction
            new_transaction = await create_transaction(db, transaction)

            return TransactionResponse(
                id=new_transaction.id,
                telegram_id=new_transaction.telegram_id,
                amount=new_transaction.amount,
                description=new_transaction.description,
                category_id=new_transaction.category_id,
                transaction_type=new_transaction.transaction_type,
                transaction_date=new_transaction.transaction_date,
                created_at=new_transaction.created_at
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    telegram_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100, le=1000)
):
    """Get user transactions"""
    try:
        async for db in get_db():
            # Parse dates if provided
            start = datetime.fromisoformat(start_date) if start_date else None
            end = datetime.fromisoformat(end_date) if end_date else None

            transactions = await get_user_transactions(
                db,
                telegram_id,
                start_date=start,
                end_date=end,
                limit=limit
            )

            return [
                TransactionResponse(
                    id=t.id,
                    telegram_id=t.telegram_id,
                    amount=t.amount,
                    description=t.description,
                    category_id=t.category_id,
                    transaction_type=t.transaction_type,
                    transaction_date=t.transaction_date,
                    created_at=t.created_at
                )
                for t in transactions
            ]
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/by-category")
async def get_category_analytics(
    telegram_id: int,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    """Get spending analytics by category"""
    try:
        async for db in get_db():
            start = datetime.fromisoformat(start_date) if start_date else None
            end = datetime.fromisoformat(end_date) if end_date else None

            transactions = await get_user_transactions(
                db,
                telegram_id,
                start_date=start,
                end_date=end
            )

            # Group by category
            category_totals = {}
            for t in transactions:
                if t.transaction_type == 'expense':
                    cat = t.category
                    if cat.name not in category_totals:
                        category_totals[cat.name] = {
                            'total': 0,
                            'icon': cat.icon,
                            'color': cat.color
                        }
                    category_totals[cat.name]['total'] += t.amount

            result = [
                {
                    'name': name,
                    'total': data['total'],
                    'icon': data['icon'],
                    'color': data['color']
                }
                for name, data in category_totals.items()
            ]

            return result
    except Exception as e:
        logger.error(f"Error getting category analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))