"""
Feedback Schemas
"""
from pydantic import BaseModel, EmailStr


class FeedbackCreate(BaseModel):
    """Schema for feedback submission"""
    name: str
    email: EmailStr
    message: str
    telegram_id: int


class FeedbackResponse(BaseModel):
    """Schema for feedback response"""
    status: str
    message: str