"""
AI Insights API Endpoints
Financial analysis and predictions
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import logging

from app.db.database import get_db
from app.services.ai_insights_service import ai_insights_service

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# SCHEMAS
# ============================================================================

class MonthlyInsightsRequest(BaseModel):
    telegram_id: int
    language: Optional[str] = 'de'


class PredictionRequest(BaseModel):
    telegram_id: int


class BudgetSuggestionRequest(BaseModel):
    telegram_id: int
    target_savings_percentage: Optional[float] = 20.0


class AnomalyDetectionRequest(BaseModel):
    telegram_id: int


# ============================================================================
# INSIGHTS ENDPOINTS
# ============================================================================

@router.post("/monthly-insights")
async def get_monthly_insights(
        request: MonthlyInsightsRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Get comprehensive monthly financial insights with AI analysis

    Premium feature

    Returns:
    - Spending summary
    - Spending trend (increasing/decreasing/stable)
    - Top categories analysis
    - Budget suggestions
    - Savings opportunities
    - Predictions for next month
    - Important alerts
    """
    try:
        logger.info(f"Generating monthly insights for user {request.telegram_id}")

        insights = await ai_insights_service.generate_monthly_insights(
            telegram_id=request.telegram_id,
            db=db,
            language=request.language
        )

        if not insights.get('success'):
            raise HTTPException(
                status_code=400,
                detail=insights.get('error', 'Failed to generate insights')
            )

        return insights

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating monthly insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict-next-month")
async def predict_next_month(
        request: PredictionRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Predict spending for next month based on historical data

    Premium feature

    Returns:
    - Predicted total spending
    - Confidence level
    - Breakdown by category
    """
    try:
        logger.info(f"Predicting next month spending for user {request.telegram_id}")

        prediction = await ai_insights_service.predict_next_month(
            telegram_id=request.telegram_id,
            db=db
        )

        if not prediction.get('success'):
            raise HTTPException(
                status_code=400,
                detail=prediction.get('error', 'Failed to generate prediction')
            )

        return prediction

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting next month: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/budget-suggestions")
async def get_budget_suggestions(
        request: BudgetSuggestionRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Get AI-powered budget suggestions

    Premium feature

    Args:
        telegram_id: User ID
        target_savings_percentage: Target savings percentage (default 20%)

    Returns:
    - Current spending by category
    - Suggested budgets per category
    - Potential total savings
    - AI explanations for each suggestion
    """
    try:
        logger.info(f"Generating budget suggestions for user {request.telegram_id}")

        suggestions = await ai_insights_service.suggest_budgets(
            telegram_id=request.telegram_id,
            db=db,
            target_savings_percentage=request.target_savings_percentage
        )

        if not suggestions.get('success'):
            raise HTTPException(
                status_code=400,
                detail=suggestions.get('error', 'Failed to generate budget suggestions')
            )

        return suggestions

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating budget suggestions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-anomalies")
async def detect_anomalies(
        request: AnomalyDetectionRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Detect unusual spending patterns

    Premium feature

    Returns:
    - List of anomalies with:
      - Type (unusual_expense, frequent_small_purchases, etc.)
      - Description
      - Amount
      - Category
      - Date
      - Severity (high/medium/low)
    """
    try:
        logger.info(f"Detecting anomalies for user {request.telegram_id}")

        anomalies = await ai_insights_service.detect_anomalies(
            telegram_id=request.telegram_id,
            db=db
        )

        return {
            "success": True,
            "anomalies": anomalies,
            "count": len(anomalies)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights-summary/{telegram_id}")
async def get_insights_summary(
        telegram_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get quick insights summary (lighter version for dashboard)

    Returns:
    - This month total spending
    - Comparison with last month
    - Top 3 categories
    - Quick tips
    """
    try:
        from datetime import date, timedelta
        from sqlalchemy import select, func, and_
        from app.db.models import Transaction

        # Get this month's transactions
        today = date.today()
        first_day_this_month = today.replace(day=1)

        result = await db.execute(
            select(
                func.sum(Transaction.amount).label('total'),
                func.count(Transaction.id).label('count')
            )
            .where(
                and_(
                    Transaction.telegram_id == telegram_id,
                    Transaction.transaction_date >= first_day_this_month,
                    Transaction.transaction_type == 'expense'
                )
            )
        )
        this_month = result.one()

        # Get last month's total
        first_day_last_month = (first_day_this_month - timedelta(days=1)).replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)

        result = await db.execute(
            select(func.sum(Transaction.amount))
            .where(
                and_(
                    Transaction.telegram_id == telegram_id,
                    Transaction.transaction_date >= first_day_last_month,
                    Transaction.transaction_date <= last_day_last_month,
                    Transaction.transaction_type == 'expense'
                )
            )
        )
        last_month_total = float(result.scalar() or 0)

        this_month_total = float(this_month.total or 0)
        change = this_month_total - last_month_total
        change_percentage = (change / last_month_total * 100) if last_month_total > 0 else 0

        # Top 3 categories this month
        from app.db.models import Category

        result = await db.execute(
            select(
                Category.name,
                Category.icon,
                func.sum(Transaction.amount).label('total')
            )
            .join(Transaction, Transaction.category_id == Category.id)
            .where(
                and_(
                    Transaction.telegram_id == telegram_id,
                    Transaction.transaction_date >= first_day_this_month,
                    Transaction.transaction_type == 'expense'
                )
            )
            .group_by(Category.id)
            .order_by(func.sum(Transaction.amount).desc())
            .limit(3)
        )
        top_categories = [
            {
                "name": row.name,
                "icon": row.icon,
                "amount": round(float(row.total), 2),
                "percentage": round((float(row.total) / this_month_total * 100), 1) if this_month_total > 0 else 0
            }
            for row in result.all()
        ]

        return {
            "success": True,
            "this_month": {
                "total": round(this_month_total, 2),
                "transactions": this_month.count
            },
            "comparison": {
                "last_month": round(last_month_total, 2),
                "change": round(change, 2),
                "change_percentage": round(change_percentage, 1),
                "trend": "increasing" if change > 0 else "decreasing" if change < 0 else "stable"
            },
            "top_categories": top_categories
        }

    except Exception as e:
        logger.error(f"Error getting insights summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))