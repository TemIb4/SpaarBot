"""
Feedback API Endpoints
"""
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends
from app.db.database import get_db
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
        feedback: FeedbackCreate,
        db: Session = Depends(get_db)
):
    """
    Submit user feedback
    """
    try:
        # Здесь можно сохранить в БД или отправить на email
        # Пока просто логируем
        logger.info(f"Feedback from {feedback.name} ({feedback.email}): {feedback.message}")

        # TODO: В будущем можно добавить отправку на email или сохранение в БД
        # Например через SendGrid или сохранить в таблицу Feedback

        return FeedbackResponse(
            status="success",
            message="Vielen Dank für dein Feedback!"
        )
    except Exception as e:
        logger.error(f"Feedback error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")