"""
Bank CSV Integration Service
Импорт транзакций из CSV файлов различных банков
"""
import io
import csv
import logging
from typing import Dict, List, Optional
from datetime import datetime, date
from decimal import Decimal
import pandas as pd

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import Transaction, Category, User
from app.services.categorization_service import categorization_service

logger = logging.getLogger(__name__)


class BankCSVService:
    """
    Импорт транзакций из банковских CSV файлов

    Поддерживаемые форматы:
    - Deutsche Bank
    - Sparkasse
    - Commerzbank
    - N26
    - ING-DiBa
    - Generic CSV
    """

    BANK_FORMATS = {
        'deutsche_bank': {
            'encoding': 'iso-8859-1',
            'delimiter': ';',
            'date_column': 'Buchungstag',
            'amount_column': 'Betrag',
            'description_column': 'Verwendungszweck',
            'date_format': '%d.%m.%Y'
        },
        'sparkasse': {
            'encoding': 'iso-8859-1',
            'delimiter': ';',
            'date_column': 'Buchungstag',
            'amount_column': 'Betrag',
            'description_column': 'Verwendungszweck',
            'date_format': '%d.%m.%y'
        },
        'commerzbank': {
            'encoding': 'iso-8859-1',
            'delimiter': ';',
            'date_column': 'Buchungstag',
            'amount_column': 'Umsatz in EUR',
            'description_column': 'Buchungstext',
            'date_format': '%d.%m.%Y'
        },
        'n26': {
            'encoding': 'utf-8',
            'delimiter': ',',
            'date_column': 'Date',
            'amount_column': 'Amount (EUR)',
            'description_column': 'Payee',
            'date_format': '%Y-%m-%d'
        },
        'ing_diba': {
            'encoding': 'iso-8859-1',
            'delimiter': ';',
            'date_column': 'Buchung',
            'amount_column': 'Betrag',
            'description_column': 'Verwendungszweck',
            'date_format': '%d.%m.%Y'
        },
        'generic': {
            'encoding': 'utf-8',
            'delimiter': ',',
            'date_column': 'date',
            'amount_column': 'amount',
            'description_column': 'description',
            'date_format': '%Y-%m-%d'
        }
    }

    async def import_csv(
            self,
            file_content: bytes,
            telegram_id: int,
            bank_format: str,
            db: AsyncSession,
            auto_categorize: bool = True
    ) -> Dict:
        """
        Импортировать транзакции из CSV файла

        Args:
            file_content: Содержимое CSV файла в bytes
            telegram_id: ID пользователя
            bank_format: Формат банка ('deutsche_bank', 'sparkasse', etc.)
            db: Database session
            auto_categorize: Автоматически категоризировать с помощью AI

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
            # Получить конфигурацию формата
            if bank_format not in self.BANK_FORMATS:
                return {
                    "success": False,
                    "error": f"Unsupported bank format: {bank_format}"
                }

            config = self.BANK_FORMATS[bank_format]

            # Парсинг CSV
            transactions = self._parse_csv(file_content, config)

            if not transactions:
                return {
                    "success": False,
                    "error": "No valid transactions found in CSV"
                }

            # Импорт транзакций в БД
            result = await self._import_transactions(
                transactions,
                telegram_id,
                db,
                auto_categorize
            )

            logger.info(
                f"CSV import completed for user {telegram_id}: {result['imported']} imported, {result['duplicates_skipped']} duplicates")

            return {
                "success": True,
                **result
            }

        except Exception as e:
            logger.error(f"Error importing CSV: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def detect_bank_format(self, file_content: bytes) -> Optional[str]:
        """
        Автоматически определить формат банка из CSV

        Returns:
            Название формата или None
        """
        try:
            # Попробовать разные кодировки и определить формат
            for bank_format, config in self.BANK_FORMATS.items():
                try:
                    # Декодировать с нужной кодировкой
                    text = file_content.decode(config['encoding'])
                    lines = text.split('\n')

                    if len(lines) < 2:
                        continue

                    # Проверить заголовок
                    header = lines[0]
                    delimiter = config['delimiter']
                    columns = [col.strip('"') for col in header.split(delimiter)]

                    # Проверить наличие ключевых колонок
                    required_columns = [
                        config['date_column'],
                        config['amount_column'],
                        config['description_column']
                    ]

                    if all(col in columns for col in required_columns):
                        logger.info(f"Detected bank format: {bank_format}")
                        return bank_format

                except Exception:
                    continue

            logger.warning("Could not detect bank format, falling back to generic")
            return 'generic'

        except Exception as e:
            logger.error(f"Error detecting bank format: {e}")
            return None

    def _parse_csv(self, file_content: bytes, config: Dict) -> List[Dict]:
        """Парсинг CSV с использованием pandas"""

        try:
            # Декодировать содержимое
            text = file_content.decode(config['encoding'])

            # Использовать pandas для парсинга
            df = pd.read_csv(
                io.StringIO(text),
                delimiter=config['delimiter'],
                encoding=config['encoding']
            )

            # Проверить наличие необходимых колонок
            required_columns = [
                config['date_column'],
                config['amount_column'],
                config['description_column']
            ]

            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                logger.error(f"Missing columns: {missing_columns}")
                return []

            # Преобразовать данные
            transactions = []

            for _, row in df.iterrows():
                try:
                    # Дата
                    date_str = str(row[config['date_column']]).strip()
                    transaction_date = datetime.strptime(date_str, config['date_format']).date()

                    # Сумма (может быть строкой с запятой вместо точки)
                    amount_str = str(row[config['amount_column']]).strip()
                    amount_str = amount_str.replace('.', '').replace(',', '.')  # German format
                    amount = Decimal(amount_str)

                    # Описание
                    description = str(row[config['description_column']]).strip()

                    # Определить тип транзакции (expense/income)
                    transaction_type = 'expense' if amount < 0 else 'income'
                    amount = abs(amount)

                    transactions.append({
                        'date': transaction_date,
                        'amount': amount,
                        'description': description,
                        'transaction_type': transaction_type
                    })

                except Exception as e:
                    logger.warning(f"Error parsing row: {e}")
                    continue

            logger.info(f"Parsed {len(transactions)} transactions from CSV")
            return transactions

        except Exception as e:
            logger.error(f"Error parsing CSV: {e}")
            return []

    async def _import_transactions(
            self,
            transactions: List[Dict],
            telegram_id: int,
            db: AsyncSession,
            auto_categorize: bool
    ) -> Dict:
        """Импортировать транзакции в базу данных"""

        imported = 0
        duplicates_skipped = 0
        errors = 0
        details = []

        # Получить существующие транзакции для проверки дубликатов
        existing_transactions = await self._get_existing_transactions(telegram_id, db)

        for trans_data in transactions:
            try:
                # Проверка на дубликат
                if self._is_duplicate(trans_data, existing_transactions):
                    duplicates_skipped += 1
                    continue

                # Автоматическая категоризация
                category_id = None
                if auto_categorize:
                    category_result = await categorization_service.categorize_transaction(
                        description=trans_data['description'],
                        amount=float(trans_data['amount']),
                        telegram_id=telegram_id,
                        db=db
                    )
                    category_id = category_result.get('category_id')

                # Создать транзакцию
                new_transaction = Transaction(
                    telegram_id=telegram_id,
                    amount=trans_data['amount'],
                    description=trans_data['description'],
                    transaction_type=trans_data['transaction_type'],
                    transaction_date=trans_data['date'],
                    category_id=category_id
                )

                db.add(new_transaction)
                imported += 1

                details.append({
                    'date': str(trans_data['date']),
                    'amount': float(trans_data['amount']),
                    'description': trans_data['description'],
                    'status': 'imported'
                })

            except Exception as e:
                logger.error(f"Error importing transaction: {e}")
                errors += 1
                details.append({
                    'description': trans_data.get('description', 'Unknown'),
                    'status': 'error',
                    'error': str(e)
                })

        # Сохранить все транзакции
        await db.commit()

        return {
            "imported": imported,
            "duplicates_skipped": duplicates_skipped,
            "errors": errors,
            "details": details[:100]  # Максимум 100 деталей
        }

    async def _get_existing_transactions(
            self,
            telegram_id: int,
            db: AsyncSession
    ) -> List[Transaction]:
        """Получить существующие транзакции пользователя за последние 6 месяцев"""

        six_months_ago = date.today() - pd.DateOffset(months=6)

        result = await db.execute(
            select(Transaction)
            .where(
                Transaction.telegram_id == telegram_id,
                Transaction.transaction_date >= six_months_ago
            )
        )

        return result.scalars().all()

    def _is_duplicate(
            self,
            new_trans: Dict,
            existing_transactions: List[Transaction]
    ) -> bool:
        """Проверить, является ли транзакция дубликатом"""

        for existing in existing_transactions:
            # Дубликат если совпадают: дата, сумма и первые 50 символов описания
            if (
                    existing.transaction_date == new_trans['date'] and
                    abs(float(existing.amount) - float(new_trans['amount'])) < 0.01 and
                    existing.description[:50] == new_trans['description'][:50]
            ):
                return True

        return False

    def get_supported_banks(self) -> List[Dict]:
        """Получить список поддерживаемых банков"""

        bank_info = {
            'deutsche_bank': 'Deutsche Bank',
            'sparkasse': 'Sparkasse',
            'commerzbank': 'Commerzbank',
            'n26': 'N26',
            'ing_diba': 'ING-DiBa',
            'generic': 'Generic CSV (Date, Amount, Description)'
        }

        return [
            {"id": bank_id, "name": name}
            for bank_id, name in bank_info.items()
        ]

    def generate_template_csv(self, bank_format: str = 'generic') -> str:
        """Сгенерировать шаблон CSV для банка"""

        if bank_format not in self.BANK_FORMATS:
            bank_format = 'generic'

        config = self.BANK_FORMATS[bank_format]

        # Создать пример данных
        template_data = {
            config['date_column']: ['2025-01-15', '2025-01-16', '2025-01-17'],
            config['amount_column']: ['-25.50', '-15.99', '1500.00'],
            config['description_column']: [
                'REWE Sagt Danke',
                'Amazon EU S.a.r.L',
                'Salary Transfer'
            ]
        }

        # Создать CSV
        df = pd.DataFrame(template_data)
        csv_content = df.to_csv(
            sep=config['delimiter'],
            index=False,
            encoding=config['encoding']
        )

        return csv_content


# Global instance
bank_csv_service = BankCSVService()