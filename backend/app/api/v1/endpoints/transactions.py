"""
Transaction Endpoints
API endpoints для управления транзакциями с автокатегоризацией
"""
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.crud import (
    get_user_by_telegram_id,
    create_transaction,
    get_user_transactions,
    get_category_by_name,
    get_default_categories,
    create_unconfirmed_subscription
)
from app.schemas.transaction import (
    TransactionCreate,
    TransactionResponse,
)
from app.services.categorization_service import categorization_service

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=TransactionResponse)
async def add_transaction(
    transaction: TransactionCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Создать новую транзакцию с автоматической категоризацией

    - Автоматически определяет категорию на основе описания
    - Для Premium пользователей использует AI
    - Для Free пользователей использует правила
    - Автоматически определяет подписки (Premium)
    """
    try:
        # Проверить существование пользователя
        user = await get_user_by_telegram_id(db, transaction.telegram_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Автокатегоризация если категория не указана
        if not transaction.category_id:
            logger.info(f"Auto-categorizing transaction: {transaction.description}")

            category_id = await categorization_service.categorize_transaction(
                description=transaction.description,
                amount=transaction.amount,
                db=db,
                use_ai=user.is_premium  # AI только для premium
            )

            if category_id:
                transaction.category_id = category_id
                logger.info(f"Category assigned: {category_id}")
            else:
                # Default категория
                default_cat = await get_category_by_name(db, 'other')
                if default_cat:
                    transaction.category_id = default_cat.id

        # Создать транзакцию
        new_transaction = await create_transaction(db, transaction)

        # Автоопределение подписок (только для premium и expenses)
        if user.is_premium and transaction.transaction_type == 'expense':
            try:
                # Получить историю транзакций для анализа паттернов
                previous_transactions = await get_user_transactions(
                    db,
                    transaction.telegram_id,
                    limit=100
                )

                # Конвертировать в формат для анализа
                previous_data = [
                    {
                        'description': t.description,
                        'amount': float(t.amount),
                        'date': t.transaction_date.isoformat() if t.transaction_date else None
                    }
                    for t in previous_transactions
                ]

                # Проверить на подписку
                subscription_info = await categorization_service.detect_subscription(
                    description=transaction.description,
                    amount=transaction.amount,
                    previous_transactions=previous_data
                )

                # Если подписка обнаружена с высокой уверенностью
                if subscription_info['is_subscription'] and subscription_info['confidence'] > 0.7:
                    logger.info(f"Subscription detected: {subscription_info['name']} with confidence {subscription_info['confidence']}")

                    # Создать неподтвержденную подписку для review
                    await create_unconfirmed_subscription(
                        db,
                        user_id=user.id,
                        name=subscription_info['name'],
                        amount=subscription_info['amount'],
                        icon=subscription_info['icon']
                    )
            except Exception as e:
                # Не ломаем основной процесс если определение подписки failed
                logger.error(f"Subscription detection error: {e}")

        # Вернуть созданную транзакцию
        return TransactionResponse(
            id=new_transaction.id,
            telegram_id=new_transaction.telegram_id,
            amount=new_transaction.amount,
            description=new_transaction.description,
            category_id=new_transaction.category_id,
            transaction_type=new_transaction.transaction_type,
            transaction_date=new_transaction.transaction_date,
            created_at=new_transaction.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding transaction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")


@router.get("/expenses", response_model=List[TransactionResponse])
async def get_expenses(
    telegram_id: int = Query(..., description="Telegram user ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    limit: int = Query(100, le=1000, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить расходы пользователя

    Параметры:
    - telegram_id: ID пользователя в Telegram
    - start_date: Начальная дата (опционально)
    - end_date: Конечная дата (опционально)
    - category_id: Фильтр по категории (опционально)
    - limit: Максимум результатов
    """
    try:
        # Парсинг дат
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else None

        # Получить транзакции
        transactions = await get_user_transactions(
            db,
            telegram_id,
            start_date=start,
            end_date=end,
            transaction_type='expense',
            category_id=category_id,
            limit=limit
        )

        return [
            TransactionResponse(
                id=t.id,
                telegram_id=t.telegram_id,
                amount=t.amount,
                description=t.description,
                category_id=t.category_id,
                transaction_type=t.transaction_type,
                transaction_date=t.transaction_date,
                created_at=t.created_at
            )
            for t in transactions
        ]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting expenses: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    telegram_id: int = Query(..., description="Telegram user ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    transaction_type: Optional[str] = Query(None, description="Filter by type (expense/income)"),
    limit: int = Query(100, le=1000, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить все транзакции пользователя

    Поддерживает фильтрацию по дате и типу транзакции
    """
    try:
        # Парсинг дат
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else None

        # Получить транзакции
        transactions = await get_user_transactions(
            db,
            telegram_id,
            start_date=start,
            end_date=end,
            transaction_type=transaction_type,
            limit=limit
        )

        return [
            TransactionResponse(
                id=t.id,
                telegram_id=t.telegram_id,
                amount=t.amount,
                description=t.description,
                category_id=t.category_id,
                transaction_type=t.transaction_type,
                transaction_date=t.transaction_date,
                created_at=t.created_at
            )
            for t in transactions
        ]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting transactions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/by-category")
async def get_category_analytics(
    telegram_id: int = Query(..., description="Telegram user ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Получить аналитику по категориям

    Возвращает разбивку расходов по категориям с процентами
    """
    try:
        # Парсинг дат
        start = datetime.fromisoformat(start_date) if start_date else None
        end = datetime.fromisoformat(end_date) if end_date else None

        # Получить все расходы
        transactions = await get_user_transactions(
            db,
            telegram_id,
            start_date=start,
            end_date=end,
            transaction_type='expense'
        )

        # Группировка по категориям
        category_totals = {}
        total_expenses = 0

        for t in transactions:
            if t.category:
                cat_name = t.category.name
                if cat_name not in category_totals:
                    category_totals[cat_name] = {
                        'total': 0,
                        'icon': t.category.icon,
                        'color': t.category.color,
                        'count': 0
                    }
                category_totals[cat_name]['total'] += float(t.amount)
                category_totals[cat_name]['count'] += 1
                total_expenses += float(t.amount)

        # Добавить проценты
        result = []
        for name, data in category_totals.items():
            percentage = (data['total'] / total_expenses * 100) if total_expenses > 0 else 0
            result.append({
                'name': name,
                'total': round(data['total'], 2),
                'percentage': round(percentage, 1),
                'count': data['count'],
                'icon': data['icon'],
                'color': data['color']
            })

        # Сортировка по сумме (убывание)
        result.sort(key=lambda x: x['total'], reverse=True)

        return {
            'total_expenses': round(total_expenses, 2),
            'categories': result
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error getting category analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """
    Получить список всех доступных категорий
    """
    try:
        categories = await get_default_categories(db)

        return [
            {
                'id': cat.id,
                'name': cat.name,
                'icon': cat.icon,
                'color': cat.color,
                'type': cat.category_type
            }
            for cat in categories
        ]
    except Exception as e:
        logger.error(f"Error getting categories: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    telegram_id: int = Query(..., description="Telegram user ID for verification"),
    db: AsyncSession = Depends(get_db)
):
    """
    Удалить транзакцию

    Требует telegram_id для проверки владельца
    """
    try:
        from app.db.models import Transaction
        from sqlalchemy import select, delete

        # Проверить существование и владельца
        result = await db.execute(
            select(Transaction).where(
                Transaction.id == transaction_id,
                Transaction.telegram_id == telegram_id
            )
        )
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise HTTPException(
                status_code=404,
                detail="Transaction not found or you don't have permission"
            )

        # Удалить
        await db.execute(
            delete(Transaction).where(Transaction.id == transaction_id)
        )
        await db.commit()

        return {"status": "success", "message": "Transaction deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting transaction: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))