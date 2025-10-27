"""
Telegram Web App (TWA) Endpoints - УЛУЧШЕННАЯ ВЕРСИЯ (Week 1)
router_twa.py - Modern, scalable implementation
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import HTMLResponse
from pathlib import Path
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.db.crud import (
    get_default_categories,
    get_categories,
    get_user_by_telegram_id,
    create_transaction,
    get_user_accounts,
    get_transactions
)
from app.schemas.transaction import TransactionCreate
from app.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


# ============================================
# PYDANTIC MODELS
# ============================================

class CategoryResponse(BaseModel):
    """Category response model"""
    id: int
    name: str
    icon: str
    color: str
    transaction_type: str


class TransactionSubmit(BaseModel):
    """Transaction submission model"""
    telegram_id: int = Field(..., description="Telegram user ID")
    amount: float = Field(..., gt=0, description="Transaction amount")
    description: str = Field("", description="Transaction description")
    category_id: int = Field(..., description="Category ID")
    transaction_type: str = Field("expense", description="Transaction type (expense/income)")
    transaction_date: Optional[str] = Field(None, description="Transaction date (ISO format)")


class TransactionResponse(BaseModel):
    """Transaction response model"""
    id: int
    amount: float
    description: str
    category_name: str
    category_icon: str
    transaction_date: str
    transaction_type: str


# ============================================
# HTML/STATIC ENDPOINTS
# ============================================

@router.get("/expense", response_class=HTMLResponse)
async def serve_expense_twa():
    """
    Serve the HTML for the Telegram Web App for expense input

    Returns:
        HTMLResponse: The expense input TWA page

    Raises:
        HTTPException: If TWA file not found
    """
    twa_path = Path("static/twa/expense_input.html")

    if not twa_path.exists():
        logger.error(f"TWA file not found: {twa_path}")
        raise HTTPException(
            status_code=404,
            detail="TWA not found. Please check server configuration."
        )

    try:
        with open(twa_path, 'r', encoding='utf-8') as f:
            html_content = f.read()

        logger.info("✅ TWA expense page served successfully")
        return HTMLResponse(content=html_content)
    except Exception as e:
        logger.error(f"Error serving TWA: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error loading TWA: {str(e)}"
        )


# ============================================
# DATA ENDPOINTS
# ============================================

@router.get("/data/categories", response_model=List[CategoryResponse])
async def get_twa_categories(
        telegram_id: Optional[int] = Query(None, description="User ID for custom categories"),
        transaction_type: Optional[str] = Query("expense", description="Transaction type filter"),
        db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get categories for TWA

    Supports both default and user-specific categories.

    Args:
        telegram_id: Optional user ID to include custom categories
        transaction_type: Type of transaction (expense/income)
        db: Database session

    Returns:
        List of categories with id, name, icon, color, transaction_type

    Raises:
        HTTPException: If error retrieving categories
    """
    try:
        logger.info(f"📋 Fetching categories for telegram_id={telegram_id}, type={transaction_type}")

        if telegram_id:
            # Get default + user custom categories
            categories = await get_categories(db, telegram_id, transaction_type)
        else:
            # Get only default categories
            categories = await get_default_categories(db)
            if transaction_type:
                categories = [c for c in categories if c.transaction_type == transaction_type]

        result = [
            {
                "id": cat.id,
                "name": cat.name,
                "icon": cat.icon,
                "color": cat.color,
                "transaction_type": cat.transaction_type
            }
            for cat in categories
        ]

        logger.info(f"✅ Returned {len(result)} categories")
        return result

    except Exception as e:
        logger.error(f"❌ Error getting categories: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch categories: {str(e)}"
        )


@router.get("/data/user-info")
async def get_twa_user_info(
        telegram_id: int = Query(..., description="Telegram user ID"),
        db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get user info for TWA (used for personalization)

    Args:
        telegram_id: Telegram user ID
        db: Database session

    Returns:
        User information including tier, limits, stats
    """
    try:
        user = await get_user_by_telegram_id(db, telegram_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get user accounts
        accounts = await get_user_accounts(db, telegram_id)
        default_account = accounts[0] if accounts else None

        return {
            "telegram_id": user.telegram_id,
            "first_name": user.first_name,
            "username": user.username,
            "tier": user.tier,
            "is_premium": user.tier == "premium",
            "default_account_id": default_account.id if default_account else None,
            "created_at": user.created_at.isoformat(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user info: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/recent-transactions")
async def get_twa_recent_transactions(
        telegram_id: int = Query(..., description="Telegram user ID"),
        limit: int = Query(10, ge=1, le=50, description="Number of transactions to return"),
        db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get recent transactions for TWA statistics tab

    Args:
        telegram_id: Telegram user ID
        limit: Number of transactions to return (1-50)
        db: Database session

    Returns:
        List of recent transactions
    """
    try:
        # Get user
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Get transactions
        transactions = await get_transactions(
            db,
            telegram_id=telegram_id,
            limit=limit,
            offset=0
        )

        # Format response
        result = [
            {
                "id": t.id,
                "amount": float(t.amount),
                "description": t.description or "",
                "category_name": t.category.name if t.category else "Unknown",
                "category_icon": t.category.icon if t.category else "❓",
                "transaction_date": t.transaction_date.isoformat(),
                "transaction_type": t.transaction_type
            }
            for t in transactions
        ]

        logger.info(f"✅ Returned {len(result)} recent transactions for user {telegram_id}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recent transactions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SUBMISSION ENDPOINTS
# ============================================

@router.post("/expense/submit")
async def submit_twa_expense(
        expense_data: TransactionSubmit,
        db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Submit expense from TWA

    Modern implementation with:
    - Pydantic validation
    - Comprehensive error handling
    - Detailed logging
    - Success/failure responses

    Args:
        expense_data: Transaction data from TWA
        db: Database session

    Returns:
        Success response with transaction ID

    Raises:
        HTTPException: Various errors (user not found, validation, etc.)
    """
    try:
        logger.info(f"💰 Received TWA expense from user {expense_data.telegram_id}")
        logger.debug(f"Expense data: amount={expense_data.amount}, category={expense_data.category_id}")

        # Verify user exists
        user = await get_user_by_telegram_id(db, expense_data.telegram_id)
        if not user:
            logger.error(f"❌ User not found: {expense_data.telegram_id}")
            raise HTTPException(
                status_code=404,
                detail="Benutzer nicht gefunden. Bitte /start verwenden."
            )

        # Get user accounts
        accounts = await get_user_accounts(db, expense_data.telegram_id)
        if not accounts:
            logger.error(f"❌ No accounts found for user {expense_data.telegram_id}")
            raise HTTPException(
                status_code=400,
                detail="Kein Konto gefunden. Bitte erstelle erst ein Konto."
            )

        default_account = accounts[0]

        # Create transaction
        transaction = TransactionCreate(
            telegram_id=expense_data.telegram_id,
            account_id=default_account.id,
            amount=expense_data.amount,
            description=expense_data.description or "",
            category_id=expense_data.category_id,
            transaction_type=expense_data.transaction_type,
            transaction_date=expense_data.transaction_date or datetime.now().isoformat()
        )

        new_transaction = await create_transaction(db, transaction)

        logger.info(f"✅ Transaction created: ID={new_transaction.id}, Amount={new_transaction.amount}€")

        return {
            "status": "success",
            "message": "✅ Ausgabe erfolgreich gespeichert!",
            "transaction_id": new_transaction.id,
            "amount": float(new_transaction.amount),
            "description": new_transaction.description,
            "timestamp": new_transaction.created_at.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error submitting TWA expense: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Speichern: {str(e)}"
        )


# ============================================
# HEALTH CHECK
# ============================================

@router.get("/health")
async def twa_health_check() -> Dict[str, Any]:
    """
    Health check endpoint for TWA

    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "service": "Telegram Web App (TWA)",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }