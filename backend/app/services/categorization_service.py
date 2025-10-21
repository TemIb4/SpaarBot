"""
AI-based Transaction Categorization Service
Автоматическая категоризация транзакций с помощью Groq AI
"""
from typing import Optional, Dict, List
from app.services.groq_service import GroqService
from app.db.models import Category
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import json
import re

logger = logging.getLogger(__name__)

class CategorizationService:
    """Сервис для автоматической категоризации транзакций"""

    def __init__(self):
        self.groq_service = GroqService()

        # Правила для быстрой категоризации (без AI)
        self.quick_rules = {
            'food': [
                'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'mcdonalds',
                'starbucks', 'kfc', 'subway', 'essen', 'rewe', 'edeka', 'aldi',
                'lidl', 'netto', 'kaufland', 'supermarkt', 'bakery', 'bäckerei'
            ],
            'transport': [
                'uber', 'taxi', 'bus', 'train', 'flight', 'bvg', 'deutsche bahn',
                'db', 'mvg', 'benzin', 'tankstelle', 'shell', 'aral', 'esso'
            ],
            'shopping': [
                'amazon', 'ebay', 'zalando', 'h&m', 'zara', 'mediamarkt',
                'saturn', 'ikea', 'dm', 'rossmann', 'müller'
            ],
            'entertainment': [
                'spotify', 'netflix', 'disney', 'cinema', 'kino', 'theater',
                'concert', 'konzert', 'steam', 'playstation', 'xbox', 'nintendo'
            ],
            'health': [
                'apotheke', 'pharmacy', 'arzt', 'doctor', 'hospital',
                'krankenhaus', 'zahnarzt', 'dentist', 'fitness', 'gym'
            ],
            'bills': [
                'strom', 'electricity', 'gas', 'wasser', 'water', 'internet',
                'telekom', 'vodafone', 'o2', 'miete', 'rent', 'versicherung',
                'insurance'
            ]
        }

    async def categorize_transaction(
        self,
        description: str,
        amount: float,
        db: AsyncSession,
        use_ai: bool = True
    ) -> Optional[str]:
        """
        Категоризация транзакции

        Args:
            description: Описание транзакции
            amount: Сумма транзакции
            db: Database session
            use_ai: Использовать ли AI (False для быстрых правил)

        Returns:
            ID категории или None
        """
        # 1. Попробовать быструю категоризацию по правилам
        quick_category = self._quick_categorize(description)
        if quick_category:
            category = await self._get_category_by_name(db, quick_category)
            if category:
                logger.info(f"Quick categorization: {description} -> {quick_category}")
                return category.id

        # 2. Использовать AI для сложных случаев
        if use_ai:
            ai_category = await self._ai_categorize(description, amount)
            if ai_category:
                category = await self._get_category_by_name(db, ai_category)
                if category:
                    logger.info(f"AI categorization: {description} -> {ai_category}")
                    return category.id

        # 3. Default категория
        default_category = await self._get_category_by_name(db, 'other')
        return default_category.id if default_category else None

    def _quick_categorize(self, description: str) -> Optional[str]:
        """Быстрая категоризация по ключевым словам"""
        description_lower = description.lower()

        for category, keywords in self.quick_rules.items():
            if any(keyword in description_lower for keyword in keywords):
                return category

        return None

    async def _ai_categorize(self, description: str, amount: float) -> Optional[str]:
        """AI-категоризация с использованием Groq"""
        try:
            prompt = f"""Kategorisiere diese Transaktion in eine der folgenden Kategorien:
- food (Essen & Trinken)
- transport (Transport & Mobilität)
- shopping (Shopping & Kleidung)
- entertainment (Unterhaltung & Freizeit)
- health (Gesundheit & Wellness)
- bills (Rechnungen & Abonnements)
- salary (Gehalt & Einkommen)
- investment (Investitionen)
- other (Sonstiges)

Transaktion:
Beschreibung: {description}
Betrag: {amount} EUR

Antworte NUR mit dem Kategorienamen (z.B. "food"), ohne weitere Erklärung."""

            response = await self.groq_service.chat(prompt)

            # Extrahiere Kategorie aus Antwort
            category = response.strip().lower()

            # Validiere Kategorie
            valid_categories = [
                'food', 'transport', 'shopping', 'entertainment',
                'health', 'bills', 'salary', 'investment', 'other'
            ]

            if category in valid_categories:
                return category

            # Versuche Kategorie zu extrahieren, wenn AI mehr Text zurückgegeben hat
            for valid_cat in valid_categories:
                if valid_cat in category:
                    return valid_cat

            return 'other'

        except Exception as e:
            logger.error(f"AI categorization error: {e}")
            return None

    async def _get_category_by_name(
        self,
        db: AsyncSession,
        name: str
    ) -> Optional[Category]:
        """Получить категорию по имени"""
        result = await db.execute(
            select(Category).where(Category.name == name)
        )
        return result.scalar_one_or_none()

    async def detect_subscription(
        self,
        description: str,
        amount: float,
        previous_transactions: List[Dict]
    ) -> Dict:
        """
        Определить, является ли транзакция подпиской

        Args:
            description: Описание транзакции
            amount: Сумма
            previous_transactions: Предыдущие транзакции для анализа паттернов

        Returns:
            Dict с информацией о подписке
        """
        # Известные подписки
        known_subscriptions = {
            'spotify': {'name': 'Spotify', 'icon': '🎵'},
            'netflix': {'name': 'Netflix', 'icon': '🎬'},
            'amazon prime': {'name': 'Amazon Prime', 'icon': '📦'},
            'disney': {'name': 'Disney+', 'icon': '🏰'},
            'apple music': {'name': 'Apple Music', 'icon': '🎵'},
            'youtube premium': {'name': 'YouTube Premium', 'icon': '📺'},
            'adobe': {'name': 'Adobe Creative Cloud', 'icon': '🎨'},
            'dropbox': {'name': 'Dropbox', 'icon': '☁️'},
            'office 365': {'name': 'Microsoft 365', 'icon': '💼'},
        }

        description_lower = description.lower()

        # Проверка известных подписок
        for key, sub_info in known_subscriptions.items():
            if key in description_lower:
                return {
                    'is_subscription': True,
                    'name': sub_info['name'],
                    'icon': sub_info['icon'],
                    'amount': amount,
                    'confidence': 0.95,
                    'auto_detected': True
                }

        # Анализ паттернов повторяющихся платежей
        if previous_transactions:
            similar_transactions = [
                t for t in previous_transactions
                if self._similar_descriptions(description, t.get('description', ''))
                and abs(amount - t.get('amount', 0)) < 0.5  # Разница в пределах 0.5€
            ]

            if len(similar_transactions) >= 2:
                # Найдены повторяющиеся платежи
                return {
                    'is_subscription': True,
                    'name': description,
                    'icon': '💳',
                    'amount': amount,
                    'confidence': 0.7,
                    'auto_detected': True
                }

        return {
            'is_subscription': False,
            'confidence': 0.0,
            'auto_detected': False
        }

    def _similar_descriptions(self, desc1: str, desc2: str) -> bool:
        """Проверить схожесть описаний"""
        # Удалить числа и специальные символы
        clean1 = re.sub(r'[0-9\W]+', ' ', desc1.lower()).strip()
        clean2 = re.sub(r'[0-9\W]+', ' ', desc2.lower()).strip()

        # Простое сравнение
        words1 = set(clean1.split())
        words2 = set(clean2.split())

        if not words1 or not words2:
            return False

        # Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))

        similarity = intersection / union if union > 0 else 0

        return similarity > 0.6

    async def suggest_budget(
        self,
        user_transactions: List[Dict],
        category: str
    ) -> Dict:
        """
        Предложить бюджет на основе истории транзакций

        Args:
            user_transactions: История транзакций пользователя
            category: Категория для предложения бюджета

        Returns:
            Dict с предложением бюджета
        """
        # Фильтровать транзакции по категории
        category_transactions = [
            t for t in user_transactions
            if t.get('category') == category and t.get('type') == 'expense'
        ]

        if not category_transactions:
            return {
                'suggested_amount': 0,
                'confidence': 0,
                'reasoning': 'Keine historischen Daten verfügbar'
            }

        # Вычислить среднее
        amounts = [t['amount'] for t in category_transactions]
        average = sum(amounts) / len(amounts)

        # Добавить 10% буфер
        suggested = average * 1.1

        return {
            'suggested_amount': round(suggested, 2),
            'confidence': min(len(category_transactions) / 10, 1.0),
            'reasoning': f'Basierend auf {len(category_transactions)} vergangenen Transaktionen',
            'average': round(average, 2),
            'min': round(min(amounts), 2),
            'max': round(max(amounts), 2)
        }


# Singleton instance
categorization_service = CategorizationService()