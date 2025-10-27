"""
Start command handler - УЛУЧШЕННАЯ ВЕРСИЯ (Week 1)
Современный дизайн с Inline-клавиатурой и TWA интеграцией
"""
from aiogram import Router, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
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
    Handle /start command - MODERN DESIGN VERSION

    Features:
    - Clean, modern typography with emojis
    - Inline keyboard with TWA buttons
    - Visual hierarchy
    - Premium CTA

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
        logger.info(f"✨ New user created: {telegram_id} ({user.first_name})")
    else:
        logger.info(f"👤 Existing user: {telegram_id} ({user.first_name})")

    # Construct URLs
    if settings.TELEGRAM_WEBHOOK_URL:
        base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')
    else:
        # Fallback for local development
        base_url = 'http://localhost:8000'

    # TWA URL for quick expense input (простая форма)
    twa_expense_url = f"{base_url}/api/v1/twa/expense"

    # React Web App URL (полноценное приложение)
    web_app_url = f"{base_url}/app"

    # 🎨 MODERN WELCOME MESSAGE
    welcome_text = f"""
👋 <b>{user.first_name}, willkommen bei SpaarBot!</b>

Dein intelligenter Assistent für volle Finanzkontrolle. 
Wir machen sparen leicht und transparent.

<b>🔥 Top-Features:</b>
• <b>Blitzschnelle</b> Erfassung (Text, Foto, Stimme)
• <b>KI-Kategorisierung</b> automatisch
• <b>Übersichtliches Dashboard</b> mit Insights
• <b>Smart-Analysen</b> für bessere Entscheidungen

<b>💰 FREE</b> | <b>💎 PREMIUM</b>

<i>Was möchtest du als Nächstes tun?</i>
"""

    # 📱 INLINE KEYBOARD - MODERN DESIGN
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            # Row 1: Главная кнопка
            [
                InlineKeyboardButton(
                    text="🚀 SpaarBot App öffnen",
                    web_app=WebAppInfo(url=web_app_url)
                )
            ],
            # Row 2: Быстрое действие - TWA
            [
                InlineKeyboardButton(
                    text="⚡ Schnelle Ausgabe (TWA)",
                    web_app=WebAppInfo(url=twa_expense_url)
                )
            ],
            # Row 3: Статистика и управление
            [
                InlineKeyboardButton(
                    text="📊 Dashboard & Analyse",
                    callback_data="view_stats"
                ),
                InlineKeyboardButton(
                    text="📅 Abos verwalten",
                    callback_data="view_subscriptions"
                )
            ],
            # Row 4: Premium CTA
            [
                InlineKeyboardButton(
                    text="💎 Premium upgraden (1 Monat GRATIS)",
                    callback_data="upgrade_premium"
                )
            ],
            # Row 5: Hilfe
            [
                InlineKeyboardButton(
                    text="❓ Hilfe & Funktionen",
                    callback_data="show_help"
                )
            ]
        ]
    )

    await message.answer(
        welcome_text,
        reply_markup=keyboard,
        parse_mode='HTML'
    )


@router.callback_query(lambda c: c.data == "view_stats")
async def handle_view_stats(callback: types.CallbackQuery):
    """Handle 'View Stats' button"""
    await callback.answer("Öffne Dashboard...", show_alert=False)

    settings = get_settings()
    base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '') if settings.TELEGRAM_WEBHOOK_URL else 'http://localhost:8000'
    web_app_url = f"{base_url}/app"

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📊 Dashboard öffnen",
                    web_app=WebAppInfo(url=web_app_url)
                )
            ]
        ]
    )

    await callback.message.answer(
        "📊 <b>Deine Statistiken</b>\n\nÖffne die App für detaillierte Analysen!",
        reply_markup=keyboard,
        parse_mode='HTML'
    )


@router.callback_query(lambda c: c.data == "view_subscriptions")
async def handle_view_subscriptions(callback: types.CallbackQuery):
    """Handle 'View Subscriptions' button"""
    await callback.answer("Öffne Abonnements...", show_alert=False)

    settings = get_settings()
    base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '') if settings.TELEGRAM_WEBHOOK_URL else 'http://localhost:8000'
    web_app_url = f"{base_url}/app/subscriptions"

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📅 Abos verwalten",
                    web_app=WebAppInfo(url=web_app_url)
                )
            ]
        ]
    )

    await callback.message.answer(
        "📅 <b>Abonnements</b>\n\nVerwalte deine Zahlungen in der App!",
        reply_markup=keyboard,
        parse_mode='HTML'
    )


@router.callback_query(lambda c: c.data == "upgrade_premium")
async def handle_upgrade_premium(callback: types.CallbackQuery):
    """Handle 'Upgrade Premium' button"""
    await callback.answer("Premium Vorteile...", show_alert=False)

    premium_text = """
💎 <b>SpaarBot Premium</b>

<b>🎁 1 Monat GRATIS testen!</b>

<b>Premium Features:</b>
✨ <b>Unbegrenzte</b> Transaktionen
🤖 <b>AI-Analysen</b> & Prognosen
📊 <b>Erweiterte Statistiken</b>
📧 <b>Email-Scanning</b>
🏦 <b>Bank-Integration</b> (bald)
🔔 <b>Smart-Benachrichtigungen</b>
☁️  <b>Cloud-Backup</b>

<b>Nur €4.99/Monat</b> (nach Testphase)

<i>Kündbar jederzeit. Keine Kosten.</i>
"""

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Premium aktivieren",
                    callback_data="confirm_premium"
                )
            ],
            [
                InlineKeyboardButton(
                    text="← Zurück",
                    callback_data="back_to_start"
                )
            ]
        ]
    )

    await callback.message.answer(
        premium_text,
        reply_markup=keyboard,
        parse_mode='HTML'
    )


@router.callback_query(lambda c: c.data == "show_help")
async def handle_show_help(callback: types.CallbackQuery):
    """Handle 'Help' button"""
    await callback.answer("Hilfe wird geladen...", show_alert=False)

    help_text = """
❓ <b>SpaarBot Hilfe</b>

<b>🚀 Schnellstart:</b>
1️⃣ <b>/start</b> für Hauptmenü
2️⃣ Öffne <b>App</b> oder <b>TWA</b>
3️⃣ Ausgaben hinzufügen
4️⃣ Finanzen analysieren

<b>💡 Funktionen:</b>
• Ausgaben: Text, Foto, Stimme
• Kategorien: Auto-KI
• Dashboard: Diagramme & Trends
• Abos: Wiederkehrende Zahlungen
• AI-Chat: Finanzfragen

<b>🎯 Befehle:</b>
/start - Hauptmenü
/stats - Statistiken
/help - Hilfe

<b>🆘 Support:</b>
@SpaarBot_Support
"""

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="← Zurück",
                    callback_data="back_to_start"
                )
            ]
        ]
    )

    await callback.message.answer(
        help_text,
        reply_markup=keyboard,
        parse_mode='HTML'
    )


@router.message()
async def handle_any_message(message: types.Message):
    """Handle любые другие сообщения"""
    settings = get_settings()
    base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '') if settings.TELEGRAM_WEBHOOK_URL else 'http://localhost:8000'
    web_app_url = f"{base_url}/app"

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 App öffnen",
                    web_app=WebAppInfo(url=web_app_url)
                )
            ]
        ]
    )

    response_text = """
💡 <b>Nutze die SpaarBot App!</b>

Alle Funktionen in der <b>Web-App</b>:
• Ausgaben hinzufügen
• Statistiken ansehen
• Abos verwalten
• AI-Chat nutzen

<i>Klicke unten:</i>
"""

    await message.answer(
        response_text,
        reply_markup=keyboard,
        parse_mode='HTML'
    )