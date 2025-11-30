# stats_endpoint.py - ИСПРАВЛЕНО

"""
Stats Endpoint
Real-time statistics for Dashboard
"""
import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Transaction, User, Subscription
from app.db.crud import get_user_by_telegram_id

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    telegram_id: int = Query(..., description="Telegram user ID"),
    period: str = Query("month", description="Period: day, week, 15days, month, 3months, 6months, year, alltime"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard statistics
    """
    try:
        # Get user
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Calculate date range
        now = datetime.now()
        period_map = {
            'day': timedelta(days=1),
            'week': timedelta(days=7),
            '15days': timedelta(days=15),
            'month': timedelta(days=30),
            '3months': timedelta(days=90),
            '6months': timedelta(days=180),
            'year': timedelta(days=365),
            'alltime': None
        }

        delta = period_map.get(period)
        start_date = now - delta if delta else None

        # Get expenses for period
        expense_query = select(Transaction).where(
            Transaction.telegram_id == telegram_id,
            Transaction.transaction_type == 'expense'
        )
        if start_date:
            expense_query = expense_query.where(Transaction.transaction_date >= start_date.date())

        expense_result = await db.execute(expense_query)
        expenses = expense_result.scalars().all()

        # Get income for period
        income_query = select(Transaction).where(
            Transaction.telegram_id == telegram_id,
            Transaction.transaction_type == 'income'
        )
        if start_date:
            income_query = income_query.where(Transaction.transaction_date >= start_date.date())

        income_result = await db.execute(income_query)
        incomes = income_result.scalars().all()

        # Calculate totals
        total_expenses = sum(float(t.amount) for t in expenses)
        total_income = sum(float(t.amount) for t in incomes)
        total_balance = total_income - total_expenses

        # Get active subscriptions - ИСПРАВЛЕНО: использую telegram_id вместо user_id
        subscription_query = select(Subscription).where(
            Subscription.telegram_id == telegram_id,
            Subscription.status == 'active'
        )
        subscription_result = await db.execute(subscription_query)
        subscriptions = subscription_result.scalars().all()
        monthly_subscriptions = sum(float(s.amount) for s in subscriptions)

        # Calculate daily average
        days_in_period = (now - start_date).days if start_date else 30
        if days_in_period == 0:
            days_in_period = 1
        average_day = total_expenses / days_in_period

        # Biggest expense
        biggest_expense = max((float(t.amount) for t in expenses), default=0.0)
        biggest_expense_description = None
        if expenses:
            biggest_transaction = max(expenses, key=lambda t: float(t.amount))
            biggest_expense_description = biggest_transaction.description

        # Savings rate
        savings_rate = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0.0

        # Transactions count
        transactions_count = len(expenses) + len(incomes)

        return {
            "total_balance": round(total_balance, 2),
            "total_expenses": round(total_expenses, 2),
            "total_income": round(total_income, 2),
            "monthly_subscriptions": round(monthly_subscriptions, 2),
            "average_day": round(average_day, 2),
            "biggest_expense": round(biggest_expense, 2),
            "biggest_expense_description": biggest_expense_description,
            "savings_rate": round(savings_rate, 1),
            "transactions_count": transactions_count,
            "period": period
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary")
async def get_stats_summary(
    telegram_id: int = Query(..., description="Telegram user ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistics summary for a period
    """
    try:
        # Parse dates
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else None

        # Build query
        query = select(Transaction).where(Transaction.telegram_id == telegram_id)
        if start:
            query = query.where(Transaction.transaction_date >= start.date())
        if end:
            query = query.where(Transaction.transaction_date <= end.date())

        result = await db.execute(query)
        transactions = result.scalars().all()

        # Calculate stats
        expenses = [t for t in transactions if t.transaction_type == 'expense']
        incomes = [t for t in transactions if t.transaction_type == 'income']

        total_expenses = sum(float(t.amount) for t in expenses)
        total_income = sum(float(t.amount) for t in incomes)

        return {
            "total_expenses": round(total_expenses, 2),
            "total_income": round(total_income, 2),
            "balance": round(total_income - total_expenses, 2),
            "transactions_count": len(transactions),
            "expenses_count": len(expenses),
            "income_count": len(incomes)
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting stats summary: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))