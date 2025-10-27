from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.models import User
from sqlalchemy import select
from pydantic import BaseModel

router = APIRouter()


class UserCreate(BaseModel):
    telegram_id: int
    first_name: str
    last_name: str | None = None
    username: str | None = None
    language_code: str | None = None


class UserUpdate(BaseModel):
    first_name: str | None = None
    email: str | None = None
    location: str | None = None


@router.get("/{telegram_id}")  # ✅ ИСПРАВЛЕНО: убран /users
async def get_user(telegram_id: int, db: AsyncSession = Depends(get_db)):
    """Get user by telegram_id"""
    result = await db.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("/")  # ✅ ИСПРАВЛЕНО: убран /users, теперь просто /
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create new user"""
    # Check if user already exists
    result = await db.execute(
        select(User).where(User.telegram_id == user_data.telegram_id)
    )
    existing_user = result.scalar_one_or_none()

    if existing_user:
        return existing_user

    # Create new user
    new_user = User(
        telegram_id=user_data.telegram_id,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        username=user_data.username,
        language_code=user_data.language_code or 'de',
        tier='free',
        is_premium=False,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.patch("/{telegram_id}")  # ✅ ИСПРАВЛЕНО: убран /users
async def update_user(
        telegram_id: int,
        user_data: UserUpdate,
        db: AsyncSession = Depends(get_db)
):
    """Update user data"""
    result = await db.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields
    if user_data.first_name is not None:
        user.first_name = user_data.first_name
    if user_data.email is not None:
        user.email = user_data.email
    if user_data.location is not None:
        user.location = user_data.location

    await db.commit()
    await db.refresh(user)

    return user