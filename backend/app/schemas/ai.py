"""
AI Schemas
"""
from pydantic import BaseModel


class ChatRequest(BaseModel):
    """Schema for AI chat request"""
    telegram_id: int
    message: str


class ChatResponse(BaseModel):
    """Schema for AI chat response"""
    response: str


class OCRRequest(BaseModel):
    """Schema for OCR request"""
    telegram_id: int
    image_data: str  # Base64 encoded image


class OCRResponse(BaseModel):
    """Schema for OCR response"""
    text: str
    amount: float | None = None
    description: str | None = None