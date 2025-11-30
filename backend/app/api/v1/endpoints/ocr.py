"""
OCR API Endpoint
Receipt scanning and processing
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.db.database import get_db
from app.db.models import Transaction
from app.services.ocr_service import ocr_service
from app.services.categorization_service import categorization_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/scan-receipt")
async def scan_receipt(
        receipt: UploadFile = File(...),
        telegram_id: int = Form(...),
        language: str = Form('de'),
        auto_save: bool = Form(False),
        db: AsyncSession = Depends(get_db)
):
    """
    Scan receipt using OCR and extract transaction data

    Args:
        receipt: Image file (JPG, PNG)
        telegram_id: User's Telegram ID
        language: OCR language ('de', 'en', 'ru', 'uk')
        auto_save: Automatically save transaction to database

    Returns:
        {
            "success": bool,
            "ocr_data": {
                "amount": float,
                "merchant": str,
                "date": str,
                "items": [...],
                "category": str,
                "confidence": float
            },
            "transaction_id": int (if auto_save=True)
        }
    """
    try:
        # Validate file type
        if not receipt.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")

        # Read file content
        file_content = await receipt.read()

        if len(file_content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")

        # Process with OCR
        logger.info(f"Processing receipt for user {telegram_id}")

        ocr_result = await ocr_service.process_receipt(
            image_bytes=file_content,
            language=language
        )

        if not ocr_result.get('success'):
            return {
                "success": False,
                "error": ocr_result.get('error', 'OCR processing failed'),
                "ocr_data": ocr_result
            }

        # Auto-save transaction if requested
        transaction_id = None
        if auto_save and ocr_result.get('amount', 0) > 0:
            try:
                # Get or create category
                category_result = await categorization_service.categorize_transaction(
                    description=ocr_result.get('merchant', 'Receipt'),
                    amount=ocr_result['amount'],
                    telegram_id=telegram_id,
                    db=db
                )

                # Create transaction
                new_transaction = Transaction(
                    telegram_id=telegram_id,
                    amount=ocr_result['amount'],
                    description=f"{ocr_result['merchant']} - {len(ocr_result.get('items', []))} items",
                    transaction_type='expense',
                    transaction_date=ocr_result.get('date') or None,
                    category_id=category_result.get('category_id')
                )

                db.add(new_transaction)
                await db.commit()
                await db.refresh(new_transaction)

                transaction_id = new_transaction.id
                logger.info(f"Transaction auto-saved: {transaction_id}")

            except Exception as e:
                logger.error(f"Error auto-saving transaction: {e}")
                # Continue even if save fails

        return {
            "success": True,
            "ocr_data": ocr_result,
            "transaction_id": transaction_id,
            "auto_saved": transaction_id is not None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in scan_receipt: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-receipt-text")
async def process_receipt_text(
        raw_text: str = Form(...),
        telegram_id: int = Form(...),
        language: str = Form('de'),
        db: AsyncSession = Depends(get_db)
):
    """
    Process receipt text directly (if OCR was done client-side)

    Args:
        raw_text: Extracted text from receipt
        telegram_id: User's Telegram ID
        language: Language for AI parsing

    Returns:
        Parsed transaction data
    """
    try:
        # Use AI service to parse text
        from app.services.ocr_service import OCRService

        ocr_instance = OCRService()
        parsed_data = await ocr_instance._parse_with_ai(raw_text, language)
        validated_data = ocr_instance._validate_parsed_data(parsed_data)

        return {
            "success": True,
            "parsed_data": validated_data
        }

    except Exception as e:
        logger.error(f"Error processing receipt text: {e}")
        raise HTTPException(status_code=500, detail=str(e))