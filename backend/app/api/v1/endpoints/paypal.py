"""
PayPal Integration Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.db.database import get_db
from app.services import paypal_service
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/paypal", tags=["paypal"])


class PaymentRequest(BaseModel):
    telegram_id: int
    amount: float
    description: str


class PaymentExecuteRequest(BaseModel):
    payment_id: str
    payer_id: str


class LinkAccountRequest(BaseModel):
    telegram_id: int
    access_token: str


@router.post("/create-payment")
async def create_payment(
    request: PaymentRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create PayPal payment"""
    try:
        base_url = "https://yourdomain.com"  # Replace with actual domain
        result = paypal_service.create_payment(
            amount=request.amount,
            description=request.description,
            return_url=f"{base_url}/paypal/success",
            cancel_url=f"{base_url}/paypal/cancel"
        )

        if result["success"]:
            # Save payment_id to database
            return result
        else:
            raise HTTPException(status_code=400, detail=result["error"])

    except Exception as e:
        logger.error(f"Create payment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute-payment")
async def execute_payment(
    request: PaymentExecuteRequest,
    db: AsyncSession = Depends(get_db)
):
    """Execute approved PayPal payment"""
    try:
        result = paypal_service.execute_payment(
            payment_id=request.payment_id,
            payer_id=request.payer_id
        )

        if result["success"]:
            # Update user to Premium in database
            # Create transaction record
            return result
        else:
            raise HTTPException(status_code=400, detail=result["error"])

    except Exception as e:
        logger.error(f"Execute payment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/link-account")
async def link_account(
    request: LinkAccountRequest,
    db: AsyncSession = Depends(get_db)
):
    """Link user's PayPal account"""
    try:
        result = paypal_service.link_account(
            user_id=request.telegram_id,
            access_token=request.access_token
        )

        if result["success"]:
            # Save PayPal account info to database
            return result
        else:
            raise HTTPException(status_code=400, detail=result["error"])

    except Exception as e:
        logger.error(f"Link account error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transactions/{telegram_id}")
async def get_transactions(
    telegram_id: int,
    start_date: str,
    end_date: str,
    db: AsyncSession = Depends(get_db)
):
    """Get PayPal account transactions"""
    try:
        # Get user's PayPal access token from database
        access_token = "USER_ACCESS_TOKEN"  # From database

        transactions = paypal_service.get_account_transactions(
            start_date=start_date,
            end_date=end_date,
            access_token=access_token
        )

        return {"transactions": transactions}

    except Exception as e:
        logger.error(f"Get transactions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/success")
async def payment_success(payment_id: str, payer_id: str):
    """PayPal payment success callback"""
    # Redirect to frontend with success message
    return {"message": "Payment successful", "payment_id": payment_id}


@router.get("/cancel")
async def payment_cancel():
    """PayPal payment cancel callback"""
    # Redirect to frontend with cancel message
    return {"message": "Payment cancelled"}