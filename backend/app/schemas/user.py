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
    last_name: Optional[str] = None
    language_code: Optional[str] = "de"


class UserCreate(UserBase):
    """Schema for creating a user"""
    tier: str = "free"
    ui_mode: str = "pro"
    language: str = "de"


class UserResponse(UserBase):
    """Schema for user response"""
    id: int
    tier: str
    ui_mode: str
    language: str
    paypal_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating a user"""
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: Optional[str] = None
    tier: Optional[str] = None
    ui_mode: Optional[str] = None  # ✅ НОВОЕ
    language: Optional[str] = None  # ✅ НОВОЕ
    paypal_id: Optional[str] = None  # ✅ НОВОЕ