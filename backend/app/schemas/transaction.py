# backend/app/schemas/transaction.py - ФИНАЛЬНАЯ ВЕРСИЯ С АЛИАСАМИ

"""
Transaction Schemas - С ПРАВИЛЬНЫМИ ПОЛЯМИ
"""
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, field_serializer, ConfigDict


class TransactionBase(BaseModel):
    """Base transaction schema"""
    amount: float = Field(..., gt=0, description="Transaction amount")
    description: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    transaction_type: str = Field(..., pattern="^(expense|income)$", alias="type")  # ← АЛИАС!
    transaction_date: Optional[date] = Field(None, alias="date")  # ← АЛИАС!


class TransactionCreate(TransactionBase):
    """Schema for creating a transaction"""
    telegram_id: int

    model_config = ConfigDict(populate_by_name=True)


class TransactionResponse(BaseModel):
    """Schema for transaction response - С АЛИАСАМИ"""
    id: int
    telegram_id: int
    amount: float
    description: Optional[str] = None
    category: Optional[str] = None  # ← Добавлено для имени категории
    category_id: Optional[int] = None
    transaction_type: str = Field(..., serialization_alias="type")  # ← АЛИАС!
    transaction_date: Optional[date] = Field(None, serialization_alias="date")  # ← АЛИАС!
    created_at: Optional[datetime] = None

    # Безопасная сериализация дат
    @field_serializer('transaction_date')
    def serialize_transaction_date(self, value: Optional[date]) -> str:
        if value:
            return value.isoformat()
        return date.today().isoformat()

    @field_serializer('created_at')
    def serialize_created_at(self, value: Optional[datetime]) -> str:
        if value:
            return value.isoformat()
        return datetime.now().isoformat()

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )


class CategoryBreakdown(BaseModel):
    """Schema for category analytics breakdown"""
    name: str
    total: float
    icon: str
    color: str

    model_config = ConfigDict(from_attributes=True)