"""
SQLAlchemy Database Models
Модели базы данных для SpaarBot
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date, Text, BigInteger, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
from app.db.database import Base


class User(Base):
    """
    User model - пользователь Telegram
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

    # User preferences
    language_code = Column(String, default="de")
    tier = Column(String, default="free")  # 'free' or 'premium'
    ui_mode = Column(String, default="pro")  # 'lite' or 'pro'
    language = Column(String, default="de")  # 'de', 'en', 'ru', 'uk'

    # Premium & PayPal Integration
    is_premium = Column(Boolean, default=False)
    paypal_subscription_id = Column(String, nullable=True, unique=True)
    premium_since = Column(DateTime, nullable=True)

    # PayPal Balance
    balance = Column(Float, default=0.0)  # Current balance
    currency = Column(String, default="EUR")  # Balance currency
    balance_updated_at = Column(DateTime, nullable=True)  # Last sync time

    # Legacy fields (для совместимости)
    stripe_customer_id = Column(String, nullable=True)
    paypal_id = Column(String, nullable=True)  # PayPal email/ID

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    # Relationships
    transactions = relationship(
        "Transaction",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Transaction.telegram_id"
    )
    categories = relationship(
        "Category",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    chat_messages = relationship(
        "ChatMessage",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="ChatMessage.telegram_id"
    )
    subscriptions = relationship(
        "Subscription",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="Subscription.telegram_id"
    )


class ChatMessage(Base):
    """
    AI Chat message history - история чата с AI
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False, index=True)

    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_messages", foreign_keys=[telegram_id])


class Category(Base):
    """
    Expense/Income category - категория транзакций
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    name = Column(String, nullable=False)
    icon = Column(String, default="📦")
    color = Column(String, default="#808080")
    category_type = Column(String, default="expense")  # 'expense' or 'income'

    # Для совместимости со старым кодом
    transaction_type = Column(String, default="expense")

    # Relationships
    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")


class Transaction(Base):
    """
    Financial transaction - финансовая транзакция
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    amount = Column(Numeric(10, 2), nullable=False)  # Decimal для точности
    description = Column(String, nullable=True)
    transaction_type = Column(String, default="expense")  # 'expense' or 'income'

    transaction_date = Column(Date, nullable=False, default=date.today)
    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="transactions", foreign_keys=[telegram_id])
    category = relationship("Category", back_populates="transactions")


class Subscription(Base):
    """
    User subscriptions - подписки пользователя (Netflix, Spotify, etc.)
    """
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False, index=True)

    # Subscription details
    service_name = Column(String, nullable=False)  # Старое поле (для совместимости)
    name = Column(String, nullable=False)  # Новое поле
    icon = Column(String, default="💳")

    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, default="EUR")

    billing_frequency = Column(String, default="monthly")  # Старое поле
    billing_cycle = Column(String, default="monthly")  # Новое поле: 'monthly' or 'yearly'

    next_payment_date = Column(Date, nullable=True)  # Старое поле
    next_billing_date = Column(DateTime, nullable=True)  # Новое поле

    status = Column(String, default="active")  # 'active', 'cancelled', 'expired'

    # Auto-detection fields (для автоматического определения подписок)
    confirmed = Column(Boolean, default=True, nullable=False)
    auto_detected = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="subscriptions", foreign_keys=[telegram_id])


class Feedback(Base):
    """
    User feedback - отзывы пользователей
    """
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False)

    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    message = Column(Text, nullable=False)

    rating = Column(Integer, nullable=True)  # 1-5 (optional)
    category = Column(String, default='general')  # 'bug', 'feature', 'general'

    created_at = Column(DateTime, server_default=func.now())


class Notification(Base):
    """
    User notifications - уведомления
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, ForeignKey("users.telegram_id"), nullable=False)

    type = Column(String, nullable=False)  # 'subscription', 'budget', 'weekly_report', 'ai_insight'
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)

    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


# ============================================================================
# ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ (опционально, но рекомендуется)
# ============================================================================

# Индексы уже созданы через index=True в Column определениях выше
# Дополнительные составные индексы можно добавить через Alembic миграции при необходимости