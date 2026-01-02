"""
Feedback API Endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.crud import create_feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(
        feedback: FeedbackCreate,
        db: AsyncSession = Depends(get_db)
):
    """
    Submit user feedback and save to database
    """
    try:
        # Save feedback to database
        await create_feedback(
            db=db,
            telegram_id=feedback.telegram_id,
            name=feedback.name,
            email=feedback.email,
            message=feedback.message
        )

        logger.info(f"✅ Feedback saved from {feedback.name} ({feedback.email})")

        return FeedbackResponse(
            status="success",
            message="Vielen Dank für dein Feedback!"
        )
    except Exception as e:
        logger.error(f"❌ Feedback error: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")