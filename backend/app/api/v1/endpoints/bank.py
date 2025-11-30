"""
Bank CSV Integration API Endpoints
Import transactions from bank CSV files
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import logging

from app.db.database import get_db
from app.services.bank_csv_service import bank_csv_service

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/import-csv")
async def import_bank_csv(
        csv_file: UploadFile = File(...),
        telegram_id: int = Form(...),
        bank_format: str = Form('generic'),
        auto_categorize: bool = Form(True),
        db: AsyncSession = Depends(get_db)
):
    """
    Import transactions from bank CSV file

    Premium feature

    Args:
        csv_file: CSV file from bank
        telegram_id: User's Telegram ID
        bank_format: Bank format ('deutsche_bank', 'sparkasse', 'n26', 'generic', etc.)
        auto_categorize: Automatically categorize transactions with AI

    Returns:
        {
            "success": bool,
            "imported": int,
            "duplicates_skipped": int,
            "errors": int,
            "details": [...]
        }
    """
    try:
        # Validate file type
        if not csv_file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")

        # Read file content
        file_content = await csv_file.read()

        if len(file_content) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")

        logger.info(f"Importing CSV for user {telegram_id} with format {bank_format}")

        # Import CSV
        result = await bank_csv_service.import_csv(
            file_content=file_content,
            telegram_id=telegram_id,
            bank_format=bank_format,
            db=db,
            auto_categorize=auto_categorize
        )

        if not result.get('success'):
            raise HTTPException(
                status_code=400,
                detail=result.get('error', 'Failed to import CSV')
            )

        logger.info(
            f"CSV import completed: {result['imported']} imported, "
            f"{result['duplicates_skipped']} duplicates, {result['errors']} errors"
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing CSV: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/detect-bank-format")
async def detect_bank_format(
        csv_file: UploadFile = File(...)
):
    """
    Auto-detect bank format from CSV file

    Args:
        csv_file: CSV file from bank

    Returns:
        {
            "success": bool,
            "detected_format": str,
            "confidence": str
        }
    """
    try:
        # Read file content
        file_content = await csv_file.read()

        # Detect format
        detected_format = bank_csv_service.detect_bank_format(file_content)

        if not detected_format:
            return {
                "success": False,
                "error": "Could not detect bank format",
                "detected_format": None
            }

        return {
            "success": True,
            "detected_format": detected_format,
            "confidence": "high" if detected_format != 'generic' else "medium"
        }

    except Exception as e:
        logger.error(f"Error detecting bank format: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/supported-banks")
async def get_supported_banks():
    """
    Get list of supported banks and their formats

    Returns:
        [
            {"id": "deutsche_bank", "name": "Deutsche Bank"},
            {"id": "sparkasse", "name": "Sparkasse"},
            ...
        ]
    """
    try:
        supported_banks = bank_csv_service.get_supported_banks()

        return {
            "success": True,
            "banks": supported_banks,
            "count": len(supported_banks)
        }

    except Exception as e:
        logger.error(f"Error getting supported banks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/template/{bank_format}")
async def get_csv_template(bank_format: str):
    """
    Download CSV template for specific bank format

    Args:
        bank_format: Bank format ID

    Returns:
        CSV template file
    """
    try:
        from fastapi.responses import Response

        template_csv = bank_csv_service.generate_template_csv(bank_format)

        return Response(
            content=template_csv,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=spaarbot_template_{bank_format}.csv"
            }
        )

    except Exception as e:
        logger.error(f"Error generating CSV template: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preview-csv")
async def preview_csv(
        csv_file: UploadFile = File(...),
        bank_format: str = Form('generic')
):
    """
    Preview CSV file without importing
    Shows first 10 transactions that would be imported

    Args:
        csv_file: CSV file from bank
        bank_format: Bank format

    Returns:
        {
            "success": bool,
            "preview": [
                {
                    "date": str,
                    "amount": float,
                    "description": str,
                    "type": str
                }
            ],
            "total_count": int
        }
    """
    try:
        # Read file content
        file_content = await csv_file.read()

        # Get bank format config
        if bank_format not in bank_csv_service.BANK_FORMATS:
            raise HTTPException(status_code=400, detail="Invalid bank format")

        config = bank_csv_service.BANK_FORMATS[bank_format]

        # Parse CSV
        transactions = bank_csv_service._parse_csv(file_content, config)

        if not transactions:
            raise HTTPException(status_code=400, detail="No valid transactions found")

        # Format preview (first 10)
        preview = [
            {
                "date": str(t['date']),
                "amount": float(t['amount']),
                "description": t['description'],
                "type": t['transaction_type']
            }
            for t in transactions[:10]
        ]

        return {
            "success": True,
            "preview": preview,
            "total_count": len(transactions),
            "showing": len(preview)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing CSV: {e}")
        raise HTTPException(status_code=500, detail=str(e))