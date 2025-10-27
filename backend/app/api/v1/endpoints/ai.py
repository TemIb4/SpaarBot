"""
AI Chat Endpoint
Эндпоинт для общения с AI ассистентом
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.database import get_db
from app.db.crud import get_user_by_telegram_id, get_user_transactions
from app.services import groq_service

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    """Schema for AI chat request"""
    telegram_id: int
    message: str


class ChatResponse(BaseModel):
    """Schema for AI chat response"""
    response: str


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
        # Получить пользователя
        user = await get_user_by_telegram_id(db, request.telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Получить последние транзакции для контекста
        transactions = await get_user_transactions(
            db=db,
            telegram_id=request.telegram_id,
            limit=20
        )

        # Подготовить контекст
        context_parts = []

        # Информация о пользователе
        context_parts.append(f"User: {user.first_name}")
        context_parts.append(f"Language: {user.language_code or 'de'}")
        context_parts.append(f"Tier: {'Premium' if user.is_premium else 'Free'}")

        # Последние транзакции
        if transactions:
            context_parts.append(f"\nRecent transactions ({len(transactions)}):")
            total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
            context_parts.append(f"Total expenses: €{total_expenses:.2f}")

            # Топ-3 категории
            categories = {}
            for t in transactions:
                if t.transaction_type == 'expense' and t.category:
                    cat_name = t.category.name
                    categories[cat_name] = categories.get(cat_name, 0) + t.amount

            if categories:
                top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:3]
                context_parts.append("Top categories:")
                for cat, amount in top_categories:
                    context_parts.append(f"  - {cat}: €{amount:.2f}")

        context = "\n".join(context_parts)

        # Определить язык ответа
        language_map = {
            'de': 'German',
            'en': 'English',
            'ru': 'Russian',
            'uk': 'Ukrainian'
        }
        response_language = language_map.get(user.language_code or 'de', 'German')

        # Вызвать AI сервис
        ai_response = await groq_service.chat(
            message=request.message,
            context=context,
            language=response_language
        )

        logger.info(f"AI query processed for user {request.telegram_id}")

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