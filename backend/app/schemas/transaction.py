"""
Transaction Schemas
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    """Base transaction schema"""
    amount: float = Field(..., gt=0, description="Transaction amount")
    description: Optional[str] = Field(None, max_length=500)
    category_id: int
    transaction_type: str = Field(..., pattern="^(expense|income)$")
    transaction_date: Optional[date] = None


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    telegram_id: int


class TransactionResponse(TransactionBase):
    """Schema for transaction response"""
    id: int
    telegram_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CategoryBreakdown(BaseModel):
    """Schema for category analytics breakdown"""
    name: str
    total: float
    icon: str
    color: str

    class Config:
        from_attributes = True