"""
Chat Schemas
"""
from datetime import datetime
from pydantic import BaseModel


class ChatMessageCreate(BaseModel):
    """Schema for creating a chat message"""
    telegram_id: int
    role: str  # user or assistant
    content: str


class ChatMessageResponse(BaseModel):
    """Schema for chat message response"""
    id: int
    telegram_id: int
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True