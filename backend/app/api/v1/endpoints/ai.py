"""
AI Chat Endpoints
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.groq_service import get_ai_response
from app.db.crud import get_user_by_telegram_id, get_user_transactions
from app.db.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    """Chat request model"""
    telegram_id: int
    message: str


class ChatResponse(BaseModel):
    """Chat response model"""
    response: str


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Chat with AI assistant

    Args:
        request: Chat request with telegram_id and message

    Returns:
        AI response
    """
    try:
        logger.info(f"AI Chat request from user {request.telegram_id}: {request.message}")

        # Get user context
        context = None
        async for db in get_db():
            user = await get_user_by_telegram_id(db, request.telegram_id)

            if not user:
                logger.warning(f"User {request.telegram_id} not found")
            else:
                # Get recent transactions for context
                transactions = await get_user_transactions(
                    db,
                    request.telegram_id,
                    limit=10
                )

                # Build context
                total_expenses = sum(t.amount for t in transactions if t.transaction_type == 'expense')
                total_income = sum(t.amount for t in transactions if t.transaction_type == 'income')

                context = f"""
Nutzer: {user.first_name}
Gesamte Ausgaben (letzte Transaktionen): {total_expenses:.2f}€
Gesamte Einnahmen (letzte Transaktionen): {total_income:.2f}€
Anzahl Transaktionen: {len(transactions)}
                """.strip()

                logger.info(f"User context: {context}")

        # Get AI response
        response = await get_ai_response(request.message, context)

        logger.info(f"AI Response: {response[:100]}...")

        return ChatResponse(response=response)

    except Exception as e:
        logger.error(f"Error in AI chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Abrufen der AI-Antwort: {str(e)}"
        )