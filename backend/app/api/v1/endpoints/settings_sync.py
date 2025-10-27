"""
Settings Synchronization API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.db.database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/settings", tags=["settings"])


class UserSettings(BaseModel):
    telegram_id: int
    language: str = "de"
    theme: str = "ocean_blue"
    ui_mode: str = "pro"
    currency: str = "EUR"
    notifications_enabled: bool = True


@router.get("/{telegram_id}")
async def get_settings(
        telegram_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Get user settings
    Returns saved settings or defaults
    """
    try:
        # In production: fetch from database
        # SELECT * FROM user_settings WHERE telegram_id = ?

        # Mock data - replace with actual DB query
        settings = {
            "language": "de",
            "theme": "ocean_blue",
            "ui_mode": "pro",
            "currency": "EUR",
            "notifications_enabled": True,
            "premium": False,
            "created_at": "2025-10-01T00:00:00Z",
            "updated_at": "2025-10-24T12:00:00Z"
        }

        return settings

    except Exception as e:
        logger.error(f"Get settings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{telegram_id}")
async def update_settings(
        telegram_id: int,
        settings: UserSettings,
        db: AsyncSession = Depends(get_db)
):
    """
    Update user settings
    Syncs across all devices
    """
    try:
        # Validate settings
        valid_languages = ["de", "en", "ru", "uk"]
        valid_themes = ["dark_mode", "ocean_blue", "purple_haze", "emerald_green"]
        valid_ui_modes = ["lite", "pro"]

        if settings.language not in valid_languages:
            raise HTTPException(status_code=400, detail="Invalid language")
        if settings.theme not in valid_themes:
            raise HTTPException(status_code=400, detail="Invalid theme")
        if settings.ui_mode not in valid_ui_modes:
            raise HTTPException(status_code=400, detail="Invalid UI mode")

        # In production: update database
        # UPDATE user_settings SET ... WHERE telegram_id = ?

        # Mock response
        updated_settings = {
            "telegram_id": telegram_id,
            "language": settings.language,
            "theme": settings.theme,
            "ui_mode": settings.ui_mode,
            "currency": settings.currency,
            "notifications_enabled": settings.notifications_enabled,
            "updated_at": "2025-10-24T12:00:00Z"
        }

        logger.info(f"Settings updated for user {telegram_id}")
        return {
            "success": True,
            "message": "Settings synced successfully",
            "settings": updated_settings
        }

    except Exception as e:
        logger.error(f"Update settings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{telegram_id}/sync")
async def sync_settings(
        telegram_id: int,
        db: AsyncSession = Depends(get_db)
):
    """
    Force sync settings from server
    Called when app starts
    """
    try:
        # Get latest settings from database
        settings = await get_settings(telegram_id, db)

        return {
            "success": True,
            "message": "Settings synced",
            "settings": settings,
            "sync_timestamp": "2025-10-24T12:00:00Z"
        }

    except Exception as e:
        logger.error(f"Sync settings error: {e}")
        raise HTTPException(status_code=500, detail=str(e))