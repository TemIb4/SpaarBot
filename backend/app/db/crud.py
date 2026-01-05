"""
CRUD operations for database
"""
import logging
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import User, Category, Transaction
from app.schemas.user import UserCreate
from app.schemas.transaction import TransactionCreate

logger = logging.getLogger(__name__)


# ==================== USER OPERATIONS ====================

async def get_user_by_telegram_id(db: AsyncSession, telegram_id: int) -> Optional[User]:
    """Get user by telegram ID"""
    result = await db.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user: UserCreate) -> User:
    """Create a new user"""
    db_user = User(
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        language_code=user.language_code,
        tier=user.tier or "free"
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    logger.info(f"Created user: {db_user.telegram_id}")
    return db_user


async def update_user_tier(db: AsyncSession, telegram_id: int, tier: str) -> Optional[User]:
    """Update user tier"""
    user = await get_user_by_telegram_id(db, telegram_id)
    if user:
        user.tier = tier
        await db.commit()
        await db.refresh(user)
        logger.info(f"Updated user {telegram_id} tier to {tier}")
    return user


# ==================== CATEGORY OPERATIONS ====================

async def get_category_by_name(db: AsyncSession, name: str) -> Optional[Category]:
    """Get category by name"""
    result = await db.execute(
        select(Category).where(Category.name == name)
    )
    return result.scalar_one_or_none()


async def get_category_by_id(db: AsyncSession, category_id: int) -> Optional[Category]:
    """Get category by ID"""
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    return result.scalar_one_or_none()


async def get_default_categories(db: AsyncSession) -> List[Category]:
    """Get all default categories"""
    result = await db.execute(
        select(Category).where(Category.user_id == None)
    )
    return list(result.scalars().all())


async def create_category(
    db: AsyncSession,
    name: str,
    icon: str,
    color: str,
    transaction_type: str = "expense",
    user_id: Optional[int] = None
) -> Category:
    """Create a new category"""
    category = Category(
        name=name,
        icon=icon,
        color=color,
        transaction_type=transaction_type,
        user_id=user_id
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    logger.info(f"Created category: {name}")
    return category


# ==================== TRANSACTION OPERATIONS ====================

async def create_transaction(
    db: AsyncSession,
    transaction: TransactionCreate
) -> Transaction:
    """Create a new transaction"""
    db_transaction = Transaction(
        telegram_id=transaction.telegram_id,
        amount=transaction.amount,
        description=transaction.description,
        category_id=transaction.category_id,
        transaction_type=transaction.transaction_type,
        transaction_date=transaction.transaction_date or datetime.now().date()
    )
    db.add(db_transaction)
    await db.commit()
    await db.refresh(db_transaction)
    logger.info(f"Created transaction: {db_transaction.id}")
    return db_transaction


async def get_user_transactions(
    db: AsyncSession,
    telegram_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 100
) -> List[Transaction]:
    """Get user transactions with optional date filtering"""
    query = select(Transaction).where(
        Transaction.telegram_id == telegram_id
    ).options(
        selectinload(Transaction.category)
    ).order_by(
        Transaction.transaction_date.desc()
    )

    # Add date filters if provided
    if start_date:
        query = query.where(Transaction.transaction_date >= start_date.date())
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date.date())

    query = query.limit(limit)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_transactions_by_category(
    db: AsyncSession,
    telegram_id: int,
    category_id: int,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Transaction]:
    """Get transactions by category"""
    query = select(Transaction).where(
        and_(
            Transaction.telegram_id == telegram_id,
            Transaction.category_id == category_id
        )
    ).options(
        selectinload(Transaction.category)
    ).order_by(
        Transaction.transaction_date.desc()
    )

    if start_date:
        query = query.where(Transaction.transaction_date >= start_date.date())
    if end_date:
        query = query.where(Transaction.transaction_date <= end_date.date())

    result = await db.execute(query)
    return list(result.scalars().all())


async def delete_transaction(db: AsyncSession, transaction_id: int) -> bool:
    """Delete a transaction"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if transaction:
        await db.delete(transaction)
        await db.commit()
        logger.info(f"Deleted transaction: {transaction_id}")
        return True

    return False


async def update_transaction(
    db: AsyncSession,
    transaction_id: int,
    amount: Optional[float] = None,
    description: Optional[str] = None,
    category_id: Optional[int] = None
) -> Optional[Transaction]:
    """Update a transaction"""
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if transaction:
        if amount is not None:
            transaction.amount = amount
        if description is not None:
            transaction.description = description
        if category_id is not None:
            transaction.category_id = category_id

        await db.commit()
        await db.refresh(transaction)
        logger.info(f"Updated transaction: {transaction_id}")
        return transaction

    return None


# ==================== INITIALIZATION ====================

async def init_default_categories(db: AsyncSession):
    """Initialize default categories if they don't exist"""
    default_categories = [
        # Expense categories
        ("Lebensmittel", "🍕", "#FF6B6B", "expense"),
        ("Transport", "🚗", "#4ECDC4", "expense"),
        ("Wohnen", "🏠", "#45B7D1", "expense"),
        ("Unterhaltung", "🎬", "#FFA07A", "expense"),
        ("Gesundheit", "💊", "#98D8C8", "expense"),
        ("Bildung", "📚", "#F7DC6F", "expense"),
        ("Shopping", "🛍️", "#BB8FCE", "expense"),
        ("Reisen", "✈️", "#85C1E2", "expense"),
        ("Sonstiges", "📦", "#95A5A6", "expense"),

        # Income categories
        ("Gehalt", "💰", "#2ECC71", "income"),
        ("Freelance", "💼", "#3498DB", "income"),
        ("Investitionen", "📈", "#9B59B6", "income"),
        ("Geschenke", "🎁", "#E74C3C", "income"),
        ("Sonstiges", "💵", "#1ABC9C", "income"),
    ]

    for name, icon, color, trans_type in default_categories:
        existing = await db.execute(
            select(Category).where(
                and_(
                    Category.name == name,
                    Category.transaction_type == trans_type,
                    Category.user_id == None
                )
            )
        )
        if not existing.scalar_one_or_none():
            category = Category(
                name=name,
                icon=icon,
                color=color,
                transaction_type=trans_type,
                user_id=None
            )
            db.add(category)
            logger.info(f"Created default category: {name} ({trans_type})")

    await db.commit()
    logger.info("Default categories initialized")

async def get_categories(
        db: AsyncSession,
        telegram_id: Optional[int] = None,
        transaction_type: Optional[str] = None
) -> List[Category]:
    """
    Get categories (default + user custom categories)

    Args:
        db: Database session
        telegram_id: Optional user telegram_id to include custom categories
        transaction_type: Optional filter by transaction type

    Returns:
        List of categories
    """
    query = select(Category).where(
        (Category.user_id == None) | (Category.user_id == telegram_id)
    )

    if transaction_type:
        query = query.where(Category.transaction_type == transaction_type)

    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_accounts(db: AsyncSession, telegram_id: int) -> List:
    """
    Get user's connected accounts (banks, PayPal, etc.)

    Args:
        db: Database session
        telegram_id: User telegram ID

    Returns:
        List of connected accounts with type, email, and status
    """
    user = await get_user_by_telegram_id(db, telegram_id)
    if not user:
        return []

    accounts = []

    # Check for PayPal account
    if user.paypal_id:
        accounts.append({
            "id": f"paypal_{telegram_id}",
            "type": "paypal",
            "email": user.paypal_id,
            "name": "PayPal",
            "is_default": True,
            "connected_at": user.updated_at.isoformat() if user.updated_at else None
        })

    return accounts




# ====================STUB IMPLEMENTATIONS FOR MISSING FUNCTIONS ====================
# TODO: Implement these functions properly

async def create_feedback(db: AsyncSession, telegram_id: int, message: str, rating: int = None, category: str = None):
    """Create feedback - STUB IMPLEMENTATION"""
    from app.db.models import Feedback
    feedback = Feedback(
        telegram_id=telegram_id,
        message=message,
        rating=rating,
        category=category
    )
    
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    
    return feedback


async def update_user_settings(db: AsyncSession, telegram_id: int, settings: dict):
    """Update user settings - STUB IMPLEMENTATION"""
    user = await get_user_by_telegram_id(db, telegram_id)
    if not user:
        return None
    
    for key, value in settings.items():
        if hasattr(user, key) and value is not None:
            setattr(user, key, value)
    
    await db.commit()
    await db.refresh(user)
    return user
