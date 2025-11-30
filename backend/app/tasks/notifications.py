"""
Celery Tasks for Notifications
Anomaly detection and notification management
"""
import logging
from datetime import datetime, timedelta, date

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, delete, and_
from aiogram import Bot

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.db.models import User, Notification
from app.services.ai_insights_service import ai_insights_service

logger = logging.getLogger(__name__)
settings = get_settings()

# Create async engine for tasks
engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Initialize bot
bot = Bot(token=settings.TELEGRAM_BOT_TOKEN)


@celery_app.task(name='app.tasks.notifications.detect_anomalies_all_users')
def detect_anomalies_all_users():
    """
    Detect spending anomalies for all users
    Runs daily at 20:00
    """
    import asyncio

    async def _detect_anomalies():
        async with AsyncSessionLocal() as db:
            try:
                # Get all active users (with transactions in last month)
                one_month_ago = date.today() - timedelta(days=30)

                result = await db.execute(
                    select(User)
                    .where(User.created_at <= datetime.now() - timedelta(days=7))
                )
                users = result.scalars().all()

                logger.info(f"Detecting anomalies for {len(users)} users")

                detected_count = 0
                error_count = 0

                for user in users:
                    try:
                        # Detect anomalies
                        anomalies = await ai_insights_service.detect_anomalies(
                            user.telegram_id,
                            db
                        )

                        if anomalies:
                            # Create notifications
                            for anomaly in anomalies:
                                notification = Notification(
                                    telegram_id=user.telegram_id,
                                    type='ai_insight',
                                    title='Unusual spending detected',
                                    message=anomaly['description'],
                                    read=False
                                )
                                db.add(notification)

                            await db.commit()

                            # Send immediate notification for high severity
                            high_severity_anomalies = [
                                a for a in anomalies if a.get('severity') == 'high'
                            ]

                            if high_severity_anomalies:
                                message = format_anomaly_notification(
                                    high_severity_anomalies,
                                    user.language or 'de'
                                )

                                await bot.send_message(
                                    chat_id=user.telegram_id,
                                    text=message,
                                    parse_mode='HTML'
                                )

                            detected_count += len(anomalies)
                            logger.info(f"Detected {len(anomalies)} anomalies for user {user.telegram_id}")

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error detecting anomalies for {user.telegram_id}: {e}")

                logger.info(f"Anomaly detection completed: {detected_count} detected, {error_count} errors")
                return {"detected": detected_count, "errors": error_count}

            except Exception as e:
                logger.error(f"Error in detect_anomalies_all_users: {e}")
                return {"detected": 0, "errors": 1}

    return asyncio.run(_detect_anomalies())


@celery_app.task(name='app.tasks.notifications.cleanup_old_notifications')
def cleanup_old_notifications():
    """
    Delete old read notifications
    Runs weekly on Sunday at 3:00 AM
    """
    import asyncio

    async def _cleanup():
        async with AsyncSessionLocal() as db:
            try:
                # Delete read notifications older than 30 days
                thirty_days_ago = datetime.now() - timedelta(days=30)

                result = await db.execute(
                    delete(Notification).where(
                        and_(
                            Notification.read == True,
                            Notification.created_at < thirty_days_ago
                        )
                    )
                )

                await db.commit()
                deleted_count = result.rowcount

                logger.info(f"Cleaned up {deleted_count} old notifications")
                return {"deleted": deleted_count}

            except Exception as e:
                logger.error(f"Error in cleanup_old_notifications: {e}")
                return {"deleted": 0, "error": str(e)}

    return asyncio.run(_cleanup())


@celery_app.task(name='app.tasks.notifications.send_budget_alerts')
def send_budget_alerts():
    """
    Send budget exceeded alerts to users
    Premium feature
    """
    import asyncio

    async def _send_alerts():
        async with AsyncSessionLocal() as db:
            try:
                # Get premium users
                result = await db.execute(
                    select(User).where(User.is_premium == True)
                )
                users = result.scalars().all()

                logger.info(f"Checking budget alerts for {len(users)} premium users")

                sent_count = 0
                error_count = 0

                for user in users:
                    try:
                        # Check budget status
                        # TODO: Implement budget checking logic
                        # For now, this is a placeholder

                        # Example:
                        # budgets = await get_user_budgets(user.telegram_id, db)
                        # current_spending = await get_current_month_spending(user.telegram_id, db)

                        # for budget in budgets:
                        #     if current_spending[budget.category] > budget.limit * 0.9:
                        #         # Send alert
                        #         pass

                        pass

                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error checking budget for {user.telegram_id}: {e}")

                logger.info(f"Budget alerts completed: {sent_count} sent, {error_count} errors")
                return {"sent": sent_count, "errors": error_count}

            except Exception as e:
                logger.error(f"Error in send_budget_alerts: {e}")
                return {"sent": 0, "errors": 1}

    return asyncio.run(_send_alerts())


@celery_app.task(name='app.tasks.notifications.send_daily_summary')
def send_daily_summary(telegram_id: int):
    """
    Send daily spending summary to specific user
    Can be triggered manually or scheduled per user
    """
    import asyncio

    async def _send_summary():
        async with AsyncSessionLocal() as db:
            try:
                from app.db.models import Transaction

                # Get today's transactions
                today = date.today()

                result = await db.execute(
                    select(Transaction)
                    .where(
                        and_(
                            Transaction.telegram_id == telegram_id,
                            Transaction.transaction_date == today,
                            Transaction.transaction_type == 'expense'
                        )
                    )
                )
                transactions = result.scalars().all()

                if not transactions:
                    return {"success": True, "message": "No transactions today"}

                # Calculate summary
                total = sum(float(t.amount) for t in transactions)
                count = len(transactions)

                # Get user for language
                user_result = await db.execute(
                    select(User).where(User.telegram_id == telegram_id)
                )
                user = user_result.scalar_one_or_none()

                if not user:
                    return {"success": False, "error": "User not found"}

                # Format message
                message = format_daily_summary(
                    total,
                    count,
                    transactions,
                    user.language or 'de'
                )

                await bot.send_message(
                    chat_id=telegram_id,
                    text=message,
                    parse_mode='HTML'
                )

                logger.info(f"Daily summary sent to user {telegram_id}")
                return {"success": True}

            except Exception as e:
                logger.error(f"Error sending daily summary: {e}")
                return {"success": False, "error": str(e)}

    return asyncio.run(_send_summary())


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def format_anomaly_notification(anomalies: list, language: str = 'de') -> str:
    """Format anomaly notification message"""

    if language == 'de':
        message = "⚠️ <b>Ungewöhnliche Ausgaben erkannt</b>\n\n"
        message += "Wir haben folgende ungewöhnliche Transaktionen gefunden:\n\n"

        for anomaly in anomalies[:3]:
            message += f"💳 {anomaly['description']}\n"
            message += f"💰 €{anomaly['amount']:.2f}\n"
            message += f"📅 {anomaly['date']}\n"
            message += f"📂 {anomaly['category']}\n\n"

        message += "Überprüfe deine Transaktionen in der App."

        return message

    elif language == 'en':
        message = "⚠️ <b>Unusual Spending Detected</b>\n\n"
        message += "We found the following unusual transactions:\n\n"

        for anomaly in anomalies[:3]:
            message += f"💳 {anomaly['description']}\n"
            message += f"💰 €{anomaly['amount']:.2f}\n"
            message += f"📅 {anomaly['date']}\n"
            message += f"📂 {anomaly['category']}\n\n"

        message += "Check your transactions in the app."

        return message

    # Default to German
    return format_anomaly_notification(anomalies, 'de')


def format_daily_summary(
        total: float,
        count: int,
        transactions: list,
        language: str = 'de'
) -> str:
    """Format daily spending summary"""

    if language == 'de':
        message = f"""📊 <b>Tagesübersicht</b>
📅 {date.today().strftime('%d.%m.%Y')}

💰 <b>Ausgaben heute:</b> €{total:.2f}
📝 <b>Transaktionen:</b> {count}

<b>Details:</b>
"""

        for t in transactions[:10]:
            message += f"• {t.description or 'Keine Beschreibung'}: €{float(t.amount):.2f}\n"

        if len(transactions) > 10:
            message += f"\n... und {len(transactions) - 10} weitere"

        return message

    # Default to German
    return format_daily_summary(total, count, transactions, 'de')