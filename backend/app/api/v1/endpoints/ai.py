"""
AI Chat Endpoint
Эндпоинт для общения с AI ассистентом
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.db.database import get_db
from app.db.crud import get_user_by_telegram_id, get_user_transactions
from app.services import groq_service

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    """Schema for AI chat request"""
    telegram_id: int
    message: str
    language: Optional[str] = 'de'


class ChatResponse(BaseModel):
    """Schema for AI chat response"""
    response: str


@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
@router.post("/query", response_model=ChatResponse)
async def ai_query(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    AI Chat Query

    Отправляет запрос пользователя AI ассистенту с контекстом финансов
    """
    try:
        user = await get_user_by_telegram_id(db, request.telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        transactions = await get_user_transactions(
            db=db,
            telegram_id=request.telegram_id,
            limit=20
        )

        context_parts = []
        context_parts.append(f"User: {user.first_name}")
        context_parts.append(f"Tier: {'Premium' if user.is_premium else 'Free'}")

        if transactions:
            context_parts.append(f"\nRecent transactions ({len(transactions)}):")
            total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
            context_parts.append(f"Total expenses: €{total_expenses:.2f}")

            categories = {}
            for t in transactions:
                if t.transaction_type == 'expense' and t.category:
                    cat_name = t.category.name
                    categories[cat_name] = categories.get(cat_name, 0) + t.amount

            if categories:
                top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:3]
                context_parts.append("Top spending categories:")
                for cat, amount in top_categories:
                    context_parts.append(f"  - {cat}: €{amount:.2f}")

        context = "\n".join(context_parts)

        language_map = {
            'de': 'German',
            'en': 'English',
            'ru': 'Russian',
            'uk': 'Ukrainian'
        }

        response_language = language_map.get(request.language, 'German')

        logger.info(f"AI query: user={request.telegram_id}, language={request.language} ({response_language})")

        ai_response = await groq_service.chat(
            message=request.message,
            context=context,
            language=response_language
        )

        logger.info(f"AI response sent in {response_language}")

        return ChatResponse(response=ai_response)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing AI query: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process AI query: {str(e)}")


@router.get("/health")
async def ai_health():
    """Health check for AI service"""
    return {
        "status": "healthy",
        "service": "groq",
        "model": "llama-3.3-70b-versatile"
    }