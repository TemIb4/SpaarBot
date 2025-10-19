"""
User Schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    """Base user schema"""
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None  # ✅ ДОБАВИЛИ!
    language_code: Optional[str] = "de"


class UserCreate(UserBase):
    """Schema for creating a user"""
    tier: str = "free"


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    tier: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None  # ✅ ДОБАВИЛИ!
    language_code: Optional[str] = None
    tier: Optional[str] = None