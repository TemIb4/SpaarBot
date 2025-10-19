"""
Telegram Web App (TWA) Endpoints
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse
from pathlib import Path

from app.db.database import get_db
from app.db.crud import (get_default_categories, get_categories, get_user_by_telegram_id, create_transaction, get_user_accounts)
from app.schemas.transaction import TransactionCreate
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.get("/expense", response_class=HTMLResponse)
async def serve_expense_twa():
    """Serve the HTML for the Telegram Web App for expense input"""
    twa_path = Path("static/twa/expense_input.html")

    if not twa_path.exists():
        raise HTTPException(status_code=404, detail="TWA not found")

    with open(twa_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    return HTMLResponse(content=html_content)


@router.get("/data/categories")
async def get_twa_categories(
    telegram_id: Optional[int] = Query(None),
    transaction_type: Optional[str] = Query("expense")
):
    """
    Get categories for TWA

    Args:
        telegram_id: Optional user ID to include custom categories
        transaction_type: Type of transaction (expense/income)

    Returns:
        List of categories
    """
    try:
        async for db in get_db():
            if telegram_id:
                # Get default + user custom categories
                categories = await get_categories(db, telegram_id, transaction_type)
            else:
                # Get only default categories
                categories = await get_default_categories(db)
                if transaction_type:
                    categories = [c for c in categories if c.transaction_type == transaction_type]

            return [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "icon": cat.icon,
                    "color": cat.color,
                    "transaction_type": cat.transaction_type
                }
                for cat in categories
            ]
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/expense/submit")
async def submit_twa_expense(expense_data: dict):
    """
    Submit expense from TWA

    Args:
        expense_data: Expense data from TWA

    Returns:
        Success response
    """
    try:
        logger.info(f"Received TWA expense: {expense_data}")

        # Validate required fields
        required_fields = ["telegram_id", "amount", "category_id"]
        for field in required_fields:
            if field not in expense_data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )

        async for db in get_db():
            # Verify user exists
            user = await get_user_by_telegram_id(db, expense_data["telegram_id"])
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # Create transaction
            transaction = TransactionCreate(
                telegram_id=expense_data["telegram_id"],
                amount=float(expense_data["amount"]),
                description=expense_data.get("description", ""),
                category_id=int(expense_data["category_id"]),
                transaction_type=expense_data.get("transaction_type", "expense"),
                transaction_date=expense_data.get("transaction_date")
            )

            new_transaction = await create_transaction(db, transaction)

            logger.info(f"Created transaction: {new_transaction.id}")

            return {
                "status": "success",
                "message": "Ausgabe erfolgreich gespeichert!",
                "transaction_id": new_transaction.id
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting TWA expense: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Speichern: {str(e)}"
        )