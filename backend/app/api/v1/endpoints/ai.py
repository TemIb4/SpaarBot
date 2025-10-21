"""
AI Chat API Endpoints with Context Awareness
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.ai import ChatRequest, ChatResponse
from app.services.groq_service import groq_client
from app.db.crud import (
    save_chat_message,
    get_chat_history,
    get_user_by_telegram_id,
    get_transactions_by_user,
    get_categories_by_user
)
from datetime import datetime, timedelta
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


async def build_user_context(db: Session, telegram_id: int) -> str:
    """
    Строит контекст пользователя для AI
    """
    try:
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            return ""

        # Получаем транзакции за последний месяц
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)

        transactions = await get_transactions_by_user(
            db,
            telegram_id,
            start_date.isoformat(),
            end_date.isoformat()
        )

        # Подсчитываем статистику
        expenses = [t for t in transactions if t.transaction_type == 'expense']
        total_expenses = sum(t.amount for t in expenses)
        total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')

        # Категории расходов
        category_totals = {}
        for t in expenses:
            if t.category:
                cat_name = t.category.name
                category_totals[cat_name] = category_totals.get(cat_name, 0) + t.amount

        top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:3]

        context = f"""
КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:
- Имя: {user.first_name}
- Уровень: {user.tier.upper()}
- Язык: {user.language}

ФИНАНСОВАЯ СТАТИСТИКА (последние 30 дней):
- Всего расходов: {total_expenses:.2f} EUR
- Всего доходов: {total_income:.2f} EUR
- Баланс: {(total_income - total_expenses):.2f} EUR
- Количество транзакций: {len(transactions)}
- Средний расход в день: {(total_expenses / 30):.2f} EUR

ТОП-3 КАТЕГОРИИ РАСХОДОВ:
{chr(10).join([f"- {cat}: {amt:.2f} EUR ({(amt/total_expenses*100):.1f}%)" for cat, amt in top_categories]) if top_categories else "- Нет данных"}

ВАЖНО: 
- Используй эти данные для персонализированных советов
- НЕ приветствуй пользователя в каждом ответе (только в первом сообщении)
- Отвечай на языке пользователя: {user.language}
- Будь кратким и по делу
- Давай конкретные советы на основе статистики
"""
        return context
    except Exception as e:
        logger.error(f"Context building error: {e}")
        return ""


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Chat with AI Assistant (Context-Aware)
    """
    try:
        # Сохраняем сообщение пользователя
        await save_chat_message(db, request.telegram_id, "user", request.message)

        # Получаем историю чата
        chat_history = await get_chat_history(db, request.telegram_id, limit=10)

        # Строим контекст пользователя
        user_context = await build_user_context(db, request.telegram_id)

        # Формируем системный промпт
        system_prompt = f"""Ты - умный финансовый ассистент SpaarBot. 
{user_context}

ПРАВИЛА:
1. НЕ приветствуй пользователя в каждом ответе (только если это первое сообщение в сессии)
2. Используй данные пользователя для персонализированных советов
3. Будь кратким и конкретным (2-4 предложения)
4. Отвечай на языке пользователя
5. Если нет достаточно данных - скажи об этом честно
"""

        # Формируем историю для API
        messages = [{"role": "system", "content": system_prompt}]

        # Добавляем последние сообщения из истории
        for msg in chat_history[-6:]:  # Последние 3 пары сообщений
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Добавляем текущее сообщение
        messages.append({"role": "user", "content": request.message})

        # Вызываем Groq API
        response = await groq_client.chat(messages)

        # Сохраняем ответ ассистента
        await save_chat_message(db, request.telegram_id, "assistant", response)

        return ChatResponse(response=response)

    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.delete("/chat/history/{telegram_id}")
async def clear_chat_history(
    telegram_id: int,
    db: Session = Depends(get_db)
):
    """
    Clear chat history for user
    """
    try:
        from app.db.crud import clear_chat_history as clear_history
        await clear_history(db, telegram_id)
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        logger.error(f"Clear history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history/{telegram_id}")
async def get_user_chat_history(
    telegram_id: int,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    Get chat history for user
    """
    try:
        messages = await get_chat_history(db, telegram_id, limit)
        return {
            "messages": [
                {
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.created_at.isoformat()
                }
                for msg in messages
            ]
        }
    except Exception as e:
        logger.error(f"Get history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))