"""
AI Chat API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.db.database import get_db
from groq_service import groq_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/chat", tags=["ai"])


class ChatRequest(BaseModel):
    telegram_id: int
    message: str
    language: str = "de"


class ChatResponse(BaseModel):
    response: str


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """AI Chat with real user context from database"""
    try:
        from app.db.crud import (
            get_user_by_telegram_id,
            get_user_transactions,
            get_user_subscriptions
        )
        from sqlalchemy import func, select
        from app.db.models import Transaction, Subscription

        # Get user from database
        user = await get_user_by_telegram_id(db, request.telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Fetch real user's financial context
        transactions = await get_user_transactions(
            db,
            telegram_id=request.telegram_id,
            limit=100
        )

        # Calculate totals
        total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
        total_income = sum(t.amount for t in transactions if t.type == 'income')
        balance = total_income - total_expenses

        # Get subscriptions
        subscriptions = await get_user_subscriptions(db, request.telegram_id)
        subscriptions_total = sum(s.amount for s in subscriptions)

        # Find top category
        category_totals = {}
        for t in transactions:
            if t.type == 'expense' and t.category:
                cat_name = t.category if isinstance(t.category, str) else t.category.name
                category_totals[cat_name] = category_totals.get(cat_name, 0) + t.amount

        top_category = max(category_totals.items(), key=lambda x: x[1])[0] if category_totals else "N/A"

        user_context = {
            "balance": balance,
            "expenses": total_expenses,
            "income": total_income,
            "subscriptions_count": len(subscriptions),
            "subscriptions_total": subscriptions_total,
            "transactions_count": len(transactions),
            "top_category": top_category,
            "user_name": user.first_name,
            "tier": user.tier
        }

        # Get AI response with real context
        response = await groq_client.chat_with_context(
            user_message=request.message,
            user_context=user_context,
            language=request.language
        )

        return ChatResponse(response=response)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        # Fallback to basic context if DB query fails
        user_context = {
            "balance": 0,
            "expenses": 0,
            "income": 0,
            "subscriptions_count": 0,
            "subscriptions_total": 0,
            "transactions_count": 0,
            "top_category": "N/A"
        }
        response = await groq_client.chat_with_context(
            user_message=request.message,
            user_context=user_context,
            language=request.language
        )
        return ChatResponse(response=response)