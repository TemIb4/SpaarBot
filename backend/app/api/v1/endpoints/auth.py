"""Authentication endpoints"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.crud import get_user_by_telegram_id
from app.schemas.user import UserResponse
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
        telegram_id: int,
        db: AsyncSession = Depends(get_db)
):
    """Get current user info"""
    user = await get_user_by_telegram_id(db, telegram_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user