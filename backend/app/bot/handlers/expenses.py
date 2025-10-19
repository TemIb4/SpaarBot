"""Expense-related handlers"""
from aiogram import Router, types, F
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.crud import get_user_by_telegram_id, create_transaction, get_user_accounts
from app.schemas.transaction import TransactionCreate
from app.services.groq_service import categorize_transaction
from app.bot.keyboards import get_start_keyboard
import re
import logging
from datetime import datetime

router = Router()
logger = logging.getLogger(__name__)


@router.message(Command("add"))
async def add_command(message: types.Message):
    """Handle /add command - opens TWA"""
    from app.core.config import get_settings
    settings = get_settings()

    base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')
    twa_url = f"{base_url}/static/twa/expense_input.html"

    keyboard = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(
            text="➕ Neue Ausgabe erfassen",
            web_app=types.WebAppInfo(url=twa_url)
        )]
    ])

    await message.answer(
        "🚀 <b>Öffne Web App</b> für schnelle & detaillierte Eingabe.",
        reply_markup=keyboard,
        parse_mode='HTML'
    )


@router.message(F.text.regexp(r'(\d+[,.]?\d*)\s*€?\s*(.+)'))
async def handle_text_expense(message: types.Message, db: AsyncSession):
    """Handle text expense input as fallback"""
    telegram_id = message.from_user.id
    user = await get_user_by_telegram_id(db, telegram_id)

    if not user:
        await message.answer("Bitte starte den Bot erst mit /start")
        return

    # Parse amount and description
    text = message.text.strip()
    match = re.search(r'(\d+[,.]?\d*)\s*€?\s*(.+)', text)

    if not match:
        await message.answer("❌ Format nicht erkannt. Beispiel: 15€ Kaffee")
        return

    amount = float(match.group(1).replace(',', '.'))
    description = match.group(2).strip()

    # Get user's account
    accounts = await get_user_accounts(db, user.id)
    if not accounts:
        await message.answer("❌ Kein Konto gefunden")
        return

    # Categorize with AI
    await message.answer("⏳ Analysiere...")
    category_name = await categorize_transaction(description)

    # Create transaction
    transaction_data = TransactionCreate(
        account_id=accounts[0].id,
        amount=amount,
        description=description,
        transaction_type="expense",
        transaction_date=datetime.utcnow()
    )

    transaction = await create_transaction(db, transaction_data)

    confirmation = f"""
✅ <b>Ausgabe hinzugefügt!</b>

💰 <b>{amount:.2f}€</b> - {description}
🏷️ Kategorie: {category_name}
📅 Datum: {datetime.now().strftime('%d.%m.%Y')}

<i>Tipp: Nutze die Web App für noch schnellere Eingabe!</i>
"""

    await message.answer(
        confirmation,
        reply_markup=get_start_keyboard(),
        parse_mode='HTML'
    )
    logger.info(f"Text expense created: {transaction.id}")