"""Stats and analytics handlers"""
from aiogram import Router, types, F
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.crud import get_user_by_telegram_id, get_transactions, get_spending_by_category
from app.bot.keyboards import get_stats_keyboard
from datetime import datetime, timedelta
import logging

router = Router()
logger = logging.getLogger(__name__)


@router.message(Command("stats"))
async def stats_command(message: types.Message, db: AsyncSession):
    """Handle /stats command"""
    telegram_id = message.from_user.id
    user = await get_user_by_telegram_id(db, telegram_id)

    if not user:
        await message.answer("Bitte starte den Bot erst mit /start")
        return

    # Get transactions for current month
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    transactions = await get_transactions(
        db, user.id, start_date=start_of_month, end_date=now
    )

    total_expenses = sum(t.amount for t in transactions if t.transaction_type == "expense")

    # Get spending by category
    category_breakdown = await get_spending_by_category(db, user.id, start_of_month, now)

    # Format top 3 categories
    top_categories = ""
    for i, cat in enumerate(category_breakdown[:3], 1):
        percentage = (cat['total'] / total_expenses * 100) if total_expenses > 0 else 0
        top_categories += f"{cat['icon']} <b>{cat['name']}</b>: €{cat['total']:.2f} ({percentage:.0f}%)\n"

    stats_text = f"""
📊 <b>Deine Statistiken</b>

Diese Woche: <b>€{total_expenses:.2f}</b>
Diesen Monat: <b>€{total_expenses:.2f}</b>

<b>Top 3 Kategorien:</b>
{top_categories if top_categories else "Noch keine Ausgaben"}

💡 <i>Für detaillierte Analyse öffne das Dashboard!</i>
"""

    await message.answer(
        stats_text,
        reply_markup=get_stats_keyboard(),
        parse_mode='HTML'
    )


@router.callback_query(F.data.startswith("stats_"))
async def handle_stats_period(callback: types.CallbackQuery, db: AsyncSession):
    """Handle stats period selection"""
    period = callback.data.split("_")[1]
    telegram_id = callback.from_user.id
    user = await get_user_by_telegram_id(db, telegram_id)

    now = datetime.utcnow()

    if period == "week":
        start_date = now - timedelta(days=7)
        title = "Diese Woche"
    elif period == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        title = "Diesen Monat"
    else:  # year
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        title = "Dieses Jahr"

    transactions = await get_transactions(db, user.id, start_date=start_date, end_date=now)
    total = sum(t.amount for t in transactions if t.transaction_type == "expense")

    await callback.message.edit_text(
        f"📊 <b>{title}</b>\n\nGesamtausgaben: <b>€{total:.2f}</b>\nTransaktionen: {len(transactions)}",
        reply_markup=get_stats_keyboard(),
        parse_mode='HTML'
    )
    await callback.answer()