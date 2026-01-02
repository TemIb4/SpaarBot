"""
Celery Tasks for Reports
Weekly and monthly financial reports
"""
import logging
from datetime import datetime, timedelta, date
from typing import List, Dict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from aiogram import Bot

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.db.models import User, Transaction, Category
from app.db.database import async_session_maker
from app.services.ai_insights_service import ai_insights_service

logger = logging.getLogger(__name__)
settings = get_settings()

# Initialize bot
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)


@celery_app.task(name='app.tasks.reports.send_weekly_reports')
def send_weekly_reports():
    """
    Send weekly reports to all active users
    Runs every Monday at 9:00 AM
    """
    import asyncio

    async def _send_reports():
        async with async_session_maker() as db:
            try:
                # Get all users who have transactions in the last week
                one_week_ago = date.today() - timedelta(days=7)

                result = await db.execute(
                    select(User)
                    .join(Transaction, Transaction.telegram_id == User.telegram_id)
                    .where(Transaction.transaction_date >= one_week_ago)
                    .distinct()
                )
                users = result.scalars().all()

                logger.info(f"Sending weekly reports to {len(users)} users")

                success_count = 0
                error_count = 0

                for user in users:
                    try:
                        # Generate report
                        report = await generate_weekly_report(user.telegram_id, db)

                        if report.get('success'):
                            # Format and send message
                            message = format_weekly_report(report, user.language or 'de')

                            await bot.send_message(
                                chat_id=user.telegram_id,
                                text=message,
                                parse_mode='HTML'
                            )

                            success_count += 1
                            logger.info(f"Weekly report sent to user {user.telegram_id}")

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error sending weekly report to {user.telegram_id}: {e}")

                logger.info(f"Weekly reports completed: {success_count} sent, {error_count} errors")
                return {"success": success_count, "errors": error_count}

            except Exception as e:
                logger.error(f"Error in send_weekly_reports: {e}")
                return {"success": 0, "errors": 1}

    return asyncio.run(_send_reports())


@celery_app.task(name='app.tasks.reports.generate_monthly_insights_all_users')
def generate_monthly_insights_all_users():
    """
    Generate monthly AI insights for all premium users
    Runs on the 1st of every month at 8:00 AM
    """
    import asyncio

    async def _generate_insights():
        async with async_session_maker() as db:
            try:
                # Get all premium users
                result = await db.execute(
                    select(User).where(User.is_premium == True)
                )
                users = result.scalars().all()

                logger.info(f"Generating monthly insights for {len(users)} premium users")

                success_count = 0
                error_count = 0

                for user in users:
                    try:
                        # Generate AI insights
                        insights = await ai_insights_service.generate_monthly_insights(
                            user.telegram_id,
                            db,
                            user.language or 'de'
                        )

                        if insights.get('success'):
                            # Format and send
                            message = format_monthly_insights(insights, user.language or 'de')

                            await bot.send_message(
                                chat_id=user.telegram_id,
                                text=message,
                                parse_mode='HTML'
                            )

                            success_count += 1
                            logger.info(f"Monthly insights sent to user {user.telegram_id}")

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error generating insights for {user.telegram_id}: {e}")

                logger.info(f"Monthly insights completed: {success_count} sent, {error_count} errors")
                return {"success": success_count, "errors": error_count}

            except Exception as e:
                logger.error(f"Error in generate_monthly_insights_all_users: {e}")
                return {"success": 0, "errors": 1}

    return asyncio.run(_generate_insights())


@celery_app.task(name='app.tasks.reports.send_custom_report')
def send_custom_report(telegram_id: int, report_type: str = 'weekly'):
    """
    Send custom report to specific user
    Can be triggered manually via API
    """
    import asyncio

    async def _send_report():
        async with async_session_maker() as db:
            try:
                if report_type == 'weekly':
                    report = await generate_weekly_report(telegram_id, db)
                    message = format_weekly_report(report, 'de')
                elif report_type == 'monthly':
                    insights = await ai_insights_service.generate_monthly_insights(
                        telegram_id, db, 'de'
                    )
                    message = format_monthly_insights(insights, 'de')
                else:
                    return {"success": False, "error": "Invalid report type"}

                await bot.send_message(
                    chat_id=telegram_id,
                    text=message,
                    parse_mode='HTML'
                )

                return {"success": True}

            except Exception as e:
                logger.error(f"Error sending custom report: {e}")
                return {"success": False, "error": str(e)}

    return asyncio.run(_send_report())


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def generate_weekly_report(telegram_id: int, db: AsyncSession) -> Dict:
    """Generate weekly financial report"""

    try:
        # Get transactions for the last 7 days
        one_week_ago = date.today() - timedelta(days=7)

        result = await db.execute(
            select(Transaction)
            .where(
                and_(
                    Transaction.telegram_id == telegram_id,
                    Transaction.transaction_date >= one_week_ago,
                    Transaction.transaction_type == 'expense'
                )
            )
            .order_by(Transaction.transaction_date.desc())
        )
        transactions = result.scalars().all()

        if not transactions:
            return {
                "success": True,
                "has_data": False,
                "message": "No transactions this week"
            }

        # Calculate statistics
        total_spending = sum(float(t.amount) for t in transactions)
        transaction_count = len(transactions)
        average_daily = total_spending / 7

        # Group by category
        category_breakdown = {}
        for t in transactions:
            cat_name = t.category.name if t.category else "Other"
            category_breakdown[cat_name] = category_breakdown.get(cat_name, 0) + float(t.amount)

        # Top spending day
        daily_totals = {}
        for t in transactions:
            day = t.transaction_date
            daily_totals[day] = daily_totals.get(day, 0) + float(t.amount)

        top_spending_day = max(daily_totals.items(), key=lambda x: x[1]) if daily_totals else (None, 0)

        # Compare with previous week
        two_weeks_ago = one_week_ago - timedelta(days=7)
        result = await db.execute(
            select(func.sum(Transaction.amount))
            .where(
                and_(
                    Transaction.telegram_id == telegram_id,
                    Transaction.transaction_date >= two_weeks_ago,
                    Transaction.transaction_date < one_week_ago,
                    Transaction.transaction_type == 'expense'
                )
            )
        )
        previous_week_total = float(result.scalar() or 0)

        change_percentage = 0
        if previous_week_total > 0:
            change_percentage = ((total_spending - previous_week_total) / previous_week_total) * 100

        return {
            "success": True,
            "has_data": True,
            "period": {
                "start": str(one_week_ago),
                "end": str(date.today())
            },
            "total_spending": round(total_spending, 2),
            "transaction_count": transaction_count,
            "average_daily": round(average_daily, 2),
            "category_breakdown": {k: round(v, 2) for k, v in
                                   sorted(category_breakdown.items(), key=lambda x: x[1], reverse=True)},
            "top_spending_day": {
                "date": str(top_spending_day[0]),
                "amount": round(top_spending_day[1], 2)
            } if top_spending_day[0] else None,
            "comparison": {
                "previous_week": round(previous_week_total, 2),
                "change_amount": round(total_spending - previous_week_total, 2),
                "change_percentage": round(change_percentage, 1)
            }
        }

    except Exception as e:
        logger.error(f"Error generating weekly report: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def format_weekly_report(report: Dict, language: str = 'de') -> str:
    """Format weekly report for Telegram"""

    if not report.get('has_data'):
        messages = {
            'de': '📊 <b>Wochenbericht</b>\n\nKeine Transaktionen in dieser Woche.',
            'en': '📊 <b>Weekly Report</b>\n\nNo transactions this week.',
            'ru': '📊 <b>Недельный отчёт</b>\n\nНет транзакций на этой неделе.',
            'uk': '📊 <b>Тижневий звіт</b>\n\nНемає транзакцій цього тижня.'
        }
        return messages.get(language, messages['de'])

    # German format
    if language == 'de':
        message = f"""📊 <b>Wochenbericht</b>
📅 {report['period']['start']} bis {report['period']['end']}

💰 <b>Ausgaben insgesamt:</b> €{report['total_spending']:.2f}
📝 <b>Transaktionen:</b> {report['transaction_count']}
📈 <b>Durchschnitt pro Tag:</b> €{report['average_daily']:.2f}

<b>Top Kategorien:</b>
"""

        for cat, amount in list(report['category_breakdown'].items())[:5]:
            percentage = (amount / report['total_spending']) * 100 if report['total_spending'] > 0 else 0
            message += f"• {cat}: €{amount:.2f} ({percentage:.1f}%)\n"

        if report.get('top_spending_day'):
            message += f"\n💳 <b>Tag mit höchsten Ausgaben:</b>\n{report['top_spending_day']['date']}: €{report['top_spending_day']['amount']:.2f}"

        # Comparison
        comp = report['comparison']
        change_emoji = "📈" if comp['change_percentage'] > 0 else "📉" if comp['change_percentage'] < 0 else "➡️"
        message += f"\n\n{change_emoji} <b>Vergleich zur Vorwoche:</b>\n"
        message += f"Vorwoche: €{comp['previous_week']:.2f}\n"
        message += f"Änderung: {'+' if comp['change_amount'] > 0 else ''}{comp['change_amount']:.2f} ({comp['change_percentage']:+.1f}%)"

        return message

    # English format
    elif language == 'en':
        message = f"""📊 <b>Weekly Report</b>
📅 {report['period']['start']} to {report['period']['end']}

💰 <b>Total Spending:</b> €{report['total_spending']:.2f}
📝 <b>Transactions:</b> {report['transaction_count']}
📈 <b>Average per day:</b> €{report['average_daily']:.2f}

<b>Top Categories:</b>
"""

        for cat, amount in list(report['category_breakdown'].items())[:5]:
            percentage = (amount / report['total_spending']) * 100 if report['total_spending'] > 0 else 0
            message += f"• {cat}: €{amount:.2f} ({percentage:.1f}%)\n"

        if report.get('top_spending_day'):
            message += f"\n💳 <b>Highest spending day:</b>\n{report['top_spending_day']['date']}: €{report['top_spending_day']['amount']:.2f}"

        comp = report['comparison']
        change_emoji = "📈" if comp['change_percentage'] > 0 else "📉" if comp['change_percentage'] < 0 else "➡️"
        message += f"\n\n{change_emoji} <b>Comparison to last week:</b>\n"
        message += f"Last week: €{comp['previous_week']:.2f}\n"
        message += f"Change: {'+' if comp['change_amount'] > 0 else ''}{comp['change_amount']:.2f} ({comp['change_percentage']:+.1f}%)"

        return message

    # Default to German
    return format_weekly_report(report, 'de')


def format_monthly_insights(insights: Dict, language: str = 'de') -> str:
    """Format monthly insights for Telegram"""

    if not insights.get('success'):
        return "❌ Could not generate insights"

    summary = insights.get('spending_summary', {})
    trend_emoji = {
        'increasing': '📈',
        'decreasing': '📉',
        'stable': '➡️'
    }

    if language == 'de':
        message = f"""🤖 <b>Monatliche AI-Insights</b>
📅 {insights['period']['start']} bis {insights['period']['end']}

💰 <b>Ausgaben insgesamt:</b> €{summary.get('total', 0):.2f}
📊 <b>Trend:</b> {trend_emoji.get(insights['spending_trend'], '➡️')} {insights['spending_trend']}

<b>📈 Top Kategorien:</b>
"""

        for cat in insights.get('top_categories', [])[:3]:
            message += f"• {cat['name']}: €{cat['amount']:.2f}\n  <i>{cat.get('insight', '')}</i>\n"

        if insights.get('alerts'):
            message += "\n⚠️ <b>Wichtige Hinweise:</b>\n"
            for alert in insights['alerts'][:3]:
                message += f"• {alert}\n"

        message += f"\n📝 <b>Zusammenfassung:</b>\n{insights.get('summary', '')}"

        return message

    # Default to German
    return format_monthly_insights(insights, 'de')