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
from app.core.cache import get_cache

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    telegram_id: int = Query(..., description="Telegram user ID"),
    period: str = Query("month", description="Period: day, week, 15days, month, 3months, 6months, year, alltime"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard statistics (cached for performance)
    """
    try:
        # Check cache first
        cache = get_cache()
        cache_key = f"cache:stats:dashboard:{telegram_id}:{period}"

        if cache:
            cached_data = await cache.get(cache_key)
            if cached_data:
                logger.debug(f"Returning cached dashboard stats for user {telegram_id}")
                return cached_data

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

        # Use PayPal balance if available, otherwise calculate from transactions
        if user.paypal_id and user.balance is not None:
            total_balance = float(user.balance)
            logger.info(f"💰 Using PayPal balance: {total_balance} {user.currency}")
        else:
            total_balance = total_income - total_expenses
            logger.info(f"💰 Calculated balance from transactions: {total_balance}")

        # Get active subscriptions - ИСПРАВЛЕНО: использую telegram_id вместо user_id
        subscription_query = select(Subscription).where(
            Subscription.telegram_id == telegram_id,
            Subscription.status == 'active'
        )
        subscription_result = await db.execute(subscription_query)
        subscriptions = subscription_result.scalars().all()

        # Calculate monthly cost (convert yearly to monthly)
        monthly_subscriptions = 0
        for s in subscriptions:
            amount = abs(float(s.amount))  # Use absolute value to handle negative amounts
            if s.billing_cycle == 'yearly':
                monthly_subscriptions += amount / 12
            else:  # monthly
                monthly_subscriptions += amount

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

        result = {
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

        # Cache the result (2 minutes TTL for stats)
        if cache:
            await cache.set(cache_key, result, ttl=120)

        return result

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

@router.get("/categories")
async def get_category_stats(
    telegram_id: int = Query(..., description="Telegram user ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    transaction_type: str = Query("expense", description="Transaction type: expense or income"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get statistics grouped by category
    """
    try:
        # Parse dates
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else datetime.now()

        # Build query
        query = select(Transaction).where(
            Transaction.telegram_id == telegram_id,
            Transaction.transaction_type == transaction_type
        )
        if start:
            query = query.where(Transaction.transaction_date >= start.date())
        if end:
            query = query.where(Transaction.transaction_date <= end.date())

        result = await db.execute(query)
        transactions = result.scalars().all()

        # Group by category
        categories = {}
        for t in transactions:
            category = t.category or "Uncategorized"
            if category not in categories:
                categories[category] = {
                    "category": category,
                    "total": 0,
                    "count": 0,
                    "percentage": 0
                }
            categories[category]["total"] += float(t.amount)
            categories[category]["count"] += 1

        # Calculate percentages
        total_amount = sum(c["total"] for c in categories.values())
        for category_data in categories.values():
            if total_amount > 0:
                category_data["percentage"] = round((category_data["total"] / total_amount) * 100, 1)
            category_data["total"] = round(category_data["total"], 2)

        # Convert to list and sort by total
        result_list = sorted(categories.values(), key=lambda x: x["total"], reverse=True)

        return result_list

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting category stats: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
