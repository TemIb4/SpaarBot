"""
AI-Powered Financial Insights Service
Groq AI для умного анализа финансов и рекомендаций
"""
import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta, date
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from groq import Groq

from app.db.models import Transaction, User, Category
from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class AIInsightsService:
    """
    AI-powered financial insights and predictions

    Features:
    - Spending pattern analysis
    - Budget recommendations
    - Anomaly detection
    - Savings opportunities
    - Next month spending forecast
    - Category-wise insights
    """

    def __init__(self):
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)

    async def generate_monthly_insights(
            self,
            telegram_id: int,
            db: AsyncSession,
            language: str = 'de'
    ) -> Dict:
        """
        Сгенерировать комплексные insights за последний месяц

        Returns:
            {
                "period": {"start": str, "end": str},
                "spending_summary": {
                    "total": float,
                    "average_daily": float,
                    "transaction_count": int
                },
                "spending_trend": str,  # "increasing", "decreasing", "stable"
                "top_categories": [...],
                "budget_suggestions": {...},
                "savings_opportunities": [...],
                "predictions": {
                    "next_month_total": float,
                    "confidence": float
                },
                "alerts": [...]
            }
        """
        try:
            # 1. Получить транзакции за последние 3 месяца
            months_data = await self._get_last_months_data(telegram_id, db, months=3)

            if not months_data:
                return {
                    "success": False,
                    "error": "Not enough transaction data for analysis"
                }

            # 2. Подготовить данные для AI анализа
            analysis_prompt = self._prepare_analysis_prompt(months_data, language)

            # 3. Получить AI insights
            ai_insights = await self._analyze_with_groq(analysis_prompt, language)

            # 4. Добавить статистические данные
            current_month_stats = self._calculate_month_stats(months_data[0])

            # 5. Определить тренд
            trend = self._calculate_spending_trend(months_data)

            result = {
                "success": True,
                "period": {
                    "start": str(months_data[0]['start_date']),
                    "end": str(months_data[0]['end_date'])
                },
                "spending_summary": current_month_stats,
                "spending_trend": trend,
                **ai_insights
            }

            logger.info(f"Generated insights for user {telegram_id}")
            return result

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def predict_next_month(
            self,
            telegram_id: int,
            db: AsyncSession
    ) -> Dict:
        """
        Предсказать траты на следующий месяц

        Returns:
            {
                "predicted_total": float,
                "confidence": float,
                "breakdown_by_category": {...}
            }
        """
        try:
            # Получить историю за последние 6 месяцев
            months_data = await self._get_last_months_data(telegram_id, db, months=6)

            if len(months_data) < 2:
                return {
                    "success": False,
                    "error": "Not enough historical data for prediction"
                }

            # Простое предсказание: среднее за последние 3 месяца + тренд
            recent_totals = [m['total'] for m in months_data[:3]]
            avg_spending = sum(recent_totals) / len(recent_totals)

            # Расчет тренда
            if len(recent_totals) >= 2:
                trend_percentage = ((recent_totals[0] - recent_totals[-1]) / recent_totals[-1]) * 100
                predicted_total = avg_spending * (1 + (trend_percentage / 100))
            else:
                predicted_total = avg_spending

            # Расчет confidence на основе стабильности
            std_dev = self._calculate_std_dev(recent_totals)
            confidence = max(0.5, min(1.0, 1.0 - (std_dev / avg_spending)))

            # Breakdown по категориям
            category_breakdown = await self._predict_category_breakdown(
                telegram_id, db, predicted_total, months_data
            )

            return {
                "success": True,
                "predicted_total": round(float(predicted_total), 2),
                "confidence": round(confidence, 2),
                "breakdown_by_category": category_breakdown
            }

        except Exception as e:
            logger.error(f"Error predicting next month: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def suggest_budgets(
            self,
            telegram_id: int,
            db: AsyncSession,
            target_savings_percentage: float = 20.0
    ) -> Dict:
        """
        Предложить бюджеты для категорий

        Args:
            telegram_id: ID пользователя
            db: Database session
            target_savings_percentage: Целевой процент экономии (default 20%)

        Returns:
            {
                "current_spending": {...},
                "suggested_budgets": {...},
                "potential_savings": float
            }
        """
        try:
            # Получить среднее за последние 3 месяца по категориям
            months_data = await self._get_last_months_data(telegram_id, db, months=3)

            if not months_data:
                return {
                    "success": False,
                    "error": "Not enough data for budget suggestions"
                }

            # Агрегировать по категориям
            category_spending = {}
            for month in months_data:
                for cat_name, amount in month.get('by_category', {}).items():
                    category_spending[cat_name] = category_spending.get(cat_name, 0) + amount

            # Среднее по категориям
            avg_category_spending = {
                cat: amount / len(months_data)
                for cat, amount in category_spending.items()
            }

            total_current = sum(avg_category_spending.values())
            target_total = total_current * (1 - target_savings_percentage / 100)
            reduction_needed = total_current - target_total

            # AI предложения по оптимизации бюджета
            ai_suggestions = await self._get_budget_suggestions_from_ai(
                avg_category_spending,
                reduction_needed
            )

            return {
                "success": True,
                "current_spending": {
                    k: round(float(v), 2) for k, v in avg_category_spending.items()
                },
                "suggested_budgets": ai_suggestions,
                "potential_savings": round(float(reduction_needed), 2),
                "target_savings_percentage": target_savings_percentage
            }

        except Exception as e:
            logger.error(f"Error suggesting budgets: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def detect_anomalies(
            self,
            telegram_id: int,
            db: AsyncSession
    ) -> List[Dict]:
        """
        Обнаружить аномалии в тратах

        Returns:
            [
                {
                    "type": "unusual_expense",
                    "description": "Large expense detected",
                    "amount": float,
                    "category": str,
                    "date": str
                }
            ]
        """
        try:
            # Получить транзакции за последний месяц
            one_month_ago = date.today() - timedelta(days=30)

            result = await db.execute(
                select(Transaction)
                .where(
                    and_(
                        Transaction.telegram_id == telegram_id,
                        Transaction.transaction_date >= one_month_ago,
                        Transaction.transaction_type == 'expense'
                    )
                )
                .order_by(Transaction.amount.desc())
            )
            transactions = result.scalars().all()

            if not transactions:
                return []

            # Расчет статистики
            amounts = [float(t.amount) for t in transactions]
            avg_amount = sum(amounts) / len(amounts)
            std_dev = self._calculate_std_dev(amounts)

            anomalies = []

            # Обнаружение необычно больших трат
            threshold = avg_amount + (2 * std_dev)  # 2 sigma

            for transaction in transactions:
                amount = float(transaction.amount)

                if amount > threshold:
                    anomalies.append({
                        "type": "unusual_expense",
                        "description": f"Large expense: {transaction.description or 'No description'}",
                        "amount": round(amount, 2),
                        "category": transaction.category.name if transaction.category else "Unknown",
                        "date": str(transaction.transaction_date),
                        "severity": "high" if amount > threshold * 1.5 else "medium"
                    })

            logger.info(f"Detected {len(anomalies)} anomalies for user {telegram_id}")
            return anomalies

        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []

    # ============================================================================
    # HELPER METHODS
    # ============================================================================

    async def _get_last_months_data(
            self,
            telegram_id: int,
            db: AsyncSession,
            months: int = 3
    ) -> List[Dict]:
        """Получить данные за последние N месяцев"""

        months_data = []
        today = date.today()

        for i in range(months):
            # Определить границы месяца
            if i == 0:
                start_date = today.replace(day=1)
                end_date = today
            else:
                # Предыдущие месяцы
                month_offset = today.month - i
                year_offset = 0

                while month_offset <= 0:
                    month_offset += 12
                    year_offset -= 1

                start_date = today.replace(year=today.year + year_offset, month=month_offset, day=1)

                # Последний день месяца
                if month_offset == 12:
                    end_date = start_date.replace(day=31)
                else:
                    next_month = start_date.replace(month=month_offset + 1, day=1)
                    end_date = next_month - timedelta(days=1)

            # Получить транзакции за месяц
            result = await db.execute(
                select(Transaction)
                .where(
                    and_(
                        Transaction.telegram_id == telegram_id,
                        Transaction.transaction_date >= start_date,
                        Transaction.transaction_date <= end_date,
                        Transaction.transaction_type == 'expense'
                    )
                )
                .order_by(Transaction.transaction_date.desc())
            )
            transactions = result.scalars().all()

            if not transactions:
                continue

            # Агрегировать данные
            total = sum(float(t.amount) for t in transactions)

            # По категориям
            by_category = {}
            for t in transactions:
                cat_name = t.category.name if t.category else "Other"
                by_category[cat_name] = by_category.get(cat_name, 0) + float(t.amount)

            months_data.append({
                "start_date": start_date,
                "end_date": end_date,
                "total": total,
                "transaction_count": len(transactions),
                "by_category": by_category,
                "transactions": transactions
            })

        return months_data

    def _calculate_month_stats(self, month_data: Dict) -> Dict:
        """Рассчитать статистику за месяц"""

        days_in_period = (month_data['end_date'] - month_data['start_date']).days + 1

        return {
            "total": round(month_data['total'], 2),
            "average_daily": round(month_data['total'] / days_in_period, 2),
            "transaction_count": month_data['transaction_count'],
            "days_in_period": days_in_period
        }

    def _calculate_spending_trend(self, months_data: List[Dict]) -> str:
        """Определить тренд трат"""

        if len(months_data) < 2:
            return "stable"

        current = months_data[0]['total']
        previous = months_data[1]['total']

        if previous == 0:
            return "stable"

        change_percentage = ((current - previous) / previous) * 100

        if change_percentage > 10:
            return "increasing"
        elif change_percentage < -10:
            return "decreasing"
        else:
            return "stable"

    def _calculate_std_dev(self, values: List[float]) -> float:
        """Рассчитать стандартное отклонение"""

        if len(values) < 2:
            return 0.0

        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / len(values)
        return variance ** 0.5

    def _prepare_analysis_prompt(self, months_data: List[Dict], language: str) -> str:
        """Подготовить prompt для AI анализа"""

        current_month = months_data[0]

        # Форматировать данные
        data_summary = f"""
Current Month:
- Total Spending: €{current_month['total']:.2f}
- Transactions: {current_month['transaction_count']}
- Period: {current_month['start_date']} to {current_month['end_date']}

Category Breakdown:
"""
        for cat, amount in sorted(current_month['by_category'].items(), key=lambda x: x[1], reverse=True):
            percentage = (amount / current_month['total']) * 100 if current_month['total'] > 0 else 0
            data_summary += f"- {cat}: €{amount:.2f} ({percentage:.1f}%)\n"

        # Сравнение с предыдущими месяцами
        if len(months_data) > 1:
            data_summary += f"\nPrevious Months:\n"
            for i, month in enumerate(months_data[1:], 1):
                data_summary += f"- Month -{i}: €{month['total']:.2f} ({month['transaction_count']} transactions)\n"

        return data_summary

    async def _analyze_with_groq(self, data_summary: str, language: str) -> Dict:
        """Получить insights от Groq AI"""

        lang_prompts = {
            'de': "Analysiere diese Finanzdaten und gib detaillierte Insights auf Deutsch.",
            'en': "Analyze this financial data and provide detailed insights in English.",
            'ru': "Проанализируй эти финансовые данные и дай детальные инсайты на русском.",
            'uk': "Проаналізуй ці фінансові дані та надай детальні інсайти українською."
        }

        lang_prompt = lang_prompts.get(language, lang_prompts['en'])

        system_prompt = f"""{lang_prompt}

Return JSON with:
{{
  "top_categories": [
    {{"name": "category", "amount": float, "insight": "brief insight"}}
  ],
  "budget_suggestions": {{
    "category_name": {{"current": float, "suggested": float, "reason": "explanation"}}
  }},
  "savings_opportunities": [
    {{"category": "name", "potential_savings": float, "recommendation": "detailed recommendation"}}
  ],
  "alerts": ["Important alert messages"],
  "summary": "Brief summary of financial health"
}}

Focus on actionable insights and specific recommendations."""

        user_prompt = f"""Financial Data:

{data_summary}

Provide comprehensive analysis and actionable recommendations."""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )

            content = response.choices[0].message.content.strip()

            # Удалить markdown если есть
            if content.startswith('```'):
                import re
                content = re.sub(r'^```json?\n?', '', content)
                content = re.sub(r'\n?```$', '', content)

            insights = json.loads(content)
            return insights

        except Exception as e:
            logger.error(f"Error getting AI insights: {e}")
            return {
                "top_categories": [],
                "budget_suggestions": {},
                "savings_opportunities": [],
                "alerts": [],
                "summary": "Unable to generate insights at this time"
            }

    async def _predict_category_breakdown(
            self,
            telegram_id: int,
            db: AsyncSession,
            predicted_total: float,
            months_data: List[Dict]
    ) -> Dict:
        """Предсказать распределение по категориям"""

        # Среднее распределение за последние месяцы
        category_percentages = {}

        for month in months_data[:3]:  # Последние 3 месяца
            for cat, amount in month.get('by_category', {}).items():
                if month['total'] > 0:
                    percentage = (amount / month['total']) * 100
                    category_percentages[cat] = category_percentages.get(cat, []) + [percentage]

        # Среднее процентное соотношение
        avg_percentages = {
            cat: sum(percentages) / len(percentages)
            for cat, percentages in category_percentages.items()
        }

        # Применить к предсказанной сумме
        breakdown = {
            cat: round((percentage / 100) * predicted_total, 2)
            for cat, percentage in avg_percentages.items()
        }

        return breakdown

    async def _get_budget_suggestions_from_ai(
            self,
            current_spending: Dict[str, float],
            reduction_needed: float
    ) -> Dict:
        """Получить AI предложения по бюджету"""

        system_prompt = """You are a financial advisor. Given current spending by category and a target reduction amount, suggest specific budget adjustments.

Return JSON with budget suggestions:
{
  "category_name": {
    "current": float,
    "suggested": float,
    "reduction": float,
    "reason": "explanation for reduction"
  }
}

Prioritize reducing discretionary spending (entertainment, restaurants) before necessities (groceries, utilities)."""

        user_prompt = f"""Current Monthly Spending:
{json.dumps({k: round(v, 2) for k, v in current_spending.items()}, indent=2)}

Target Reduction: €{reduction_needed:.2f}

Suggest realistic budget adjustments."""

        try:
            response = self.groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2,
                max_tokens=1500
            )

            content = response.choices[0].message.content.strip()

            if content.startswith('```'):
                import re
                content = re.sub(r'^```json?\n?', '', content)
                content = re.sub(r'\n?```$', '', content)

            suggestions = json.loads(content)
            return suggestions

        except Exception as e:
            logger.error(f"Error getting budget suggestions: {e}")
            # Fallback: равномерное сокращение
            total_current = sum(current_spending.values())
            reduction_percentage = reduction_needed / total_current if total_current > 0 else 0

            return {
                cat: {
                    "current": round(amount, 2),
                    "suggested": round(amount * (1 - reduction_percentage), 2),
                    "reduction": round(amount * reduction_percentage, 2),
                    "reason": "Proportional reduction"
                }
                for cat, amount in current_spending.items()
            }


# Global instance
ai_insights_service = AIInsightsService()