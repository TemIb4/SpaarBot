"""Start command handler - открывает React Web App"""
from aiogram import Router, types
from aiogram.filters import CommandStart
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.crud import get_user_by_telegram_id, create_user
from app.schemas.user import UserCreate
from app.core.config import get_settings
import logging

router = Router()
logger = logging.getLogger(__name__)


@router.message(CommandStart())
async def start_command(message: types.Message, db: AsyncSession):
    """
    Handle /start command - создает пользователя и показывает кнопку для открытия React Web App

    Args:
        message: Telegram message object
        db: Database session (injected by middleware)
    """
    telegram_id = message.from_user.id
    settings = get_settings()

    # Get or create user
    user = await get_user_by_telegram_id(db, telegram_id)

    if not user:
        user_data = UserCreate(
            telegram_id=telegram_id,
            username=message.from_user.username,
            first_name=message.from_user.first_name or "User"
        )
        user = await create_user(db, user_data)
        logger.info(f"New user created: {telegram_id} ({user.first_name})")
    else:
        logger.info(f"Existing user: {telegram_id} ({user.first_name})")

    # Construct Web App URL
    # React UI is served at /app endpoint by backend
    if settings.TELEGRAM_WEBHOOK_URL:
        base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')
    else:
        # Fallback for local development (won't work in Telegram, но для тестов)
        base_url = 'http://localhost:8000'

    web_app_url = f"{base_url}/app"

    # Welcome message
    welcome_text = f"""
👋 <b>Willkommen bei SpaarBot, {user.first_name}!</b>

Dein intelligenter Finanzassistent ist bereit!

🚀 <b>Öffne die App um zu starten:</b>
- 💰 Ausgaben erfassen
- 📊 Statistiken ansehen
- 📅 Abos verwalten
- 🤖 KI-Analysen erhalten

<i>Klicke auf die Schaltfläche unten</i> 👇
"""

    # Inline keyboard with Web App button
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="🚀 SpaarBot App öffnen",
                    web_app=types.WebAppInfo(url=web_app_url)
                )
            ]
        ]
    )

    await message.answer(
        welcome_text,
        reply_markup=keyboard,
        parse_mode='HTML'
    )


@router.message()
async def handle_any_message(message: types.Message):
    """
    Handle любые другие текстовые сообщения - напоминаем использовать Web App

    Args:
        message: Telegram message object
    """
    settings = get_settings()

    # Construct Web App URL
    if settings.TELEGRAM_WEBHOOK_URL:
        base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')
    else:
        base_url = 'http://localhost:8000'

    web_app_url = f"{base_url}/app"

    # Inline keyboard
    keyboard = types.InlineKeyboardMarkup(
        inline_keyboard=[
            [
                types.InlineKeyboardButton(
                    text="🚀 App öffnen",
                    web_app=types.WebAppInfo(url=web_app_url)
                )
            ]
        ]
    )

    # Response message
    response_text = """
💡 <b>Nutze die SpaarBot App!</b>

Alle Funktionen sind in der App verfügbar:
- Ausgaben hinzufügen
- Statistiken ansehen
- Abos verwalten

<i>Klicke auf die Schaltfläche unten:</i>
"""

    await message.answer(
        response_text,
        reply_markup=keyboard,
        parse_mode='HTML'
    )