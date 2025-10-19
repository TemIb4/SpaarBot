"""
SQLAlchemy database models
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
from app.db.database import Base


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    language_code = Column(String, default="de")

    # Subscription
    tier = Column(String, default="free")  # free or premium
    stripe_customer_id = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    """Expense/Income category"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)  # NULL for default

    name = Column(String, nullable=False)
    icon = Column(String, default="📦")
    color = Column(String, default="#808080")
    transaction_type = Column(String, default="expense")  # expense or income

    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")


class Transaction(Base):
    """Financial transaction"""
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, ForeignKey("users.telegram_id"), nullable=False, index=True)  # ✅ КЛЮЧЕВОЕ ПОЛЕ!
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    transaction_type = Column(String, default="expense")  # expense or income

    # Date
    transaction_date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="transactions", foreign_keys=[telegram_id])
    category = relationship("Category", back_populates="transactions")


class Subscription(Base):
    """User subscriptions (like Netflix, Spotify)"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, ForeignKey("users.telegram_id"), nullable=False)

    service_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="EUR")
    billing_frequency = Column(String, default="monthly")  # monthly, yearly

    next_payment_date = Column(Date, nullable=True)
    status = Column(String, default="active")  # active, cancelled

    created_at = Column(DateTime, server_default=func.now())