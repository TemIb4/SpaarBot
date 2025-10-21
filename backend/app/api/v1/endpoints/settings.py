"""
Settings API Endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.crud import update_user_settings, get_user_by_telegram_id
from app.schemas.user import UserUpdate, UserResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.patch("/settings/{telegram_id}", response_model=UserResponse)
async def update_settings(
        telegram_id: int,
        settings: UserUpdate,
        db: Session = Depends(get_db)
):
    """
    Update user settings (tier, ui_mode, language, paypal_id)
    """
    try:
        # Преобразуем Pydantic модель в dict, исключая None значения
        settings_dict = settings.model_dump(exclude_none=True)

        updated_user = await update_user_settings(db, telegram_id, settings_dict)

        if not updated_user:
            raise HTTPException(status_code=404, detail="User not found")

        return updated_user
    except Exception as e:
        logger.error(f"Settings update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/settings/{telegram_id}", response_model=UserResponse)
async def get_settings(
        telegram_id: int,
        db: Session = Depends(get_db)
):
    """
    Get user settings
    """
    try:
        user = await get_user_by_telegram_id(db, telegram_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return user
    except Exception as e:
        logger.error(f"Get settings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))