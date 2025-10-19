"""Telegram Bot inline keyboards"""
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from app.core.config import get_settings

settings = get_settings()


def get_start_keyboard() -> InlineKeyboardMarkup:
    """Main start menu keyboard"""
    base_url = settings.TELEGRAM_WEBHOOK_URL.replace('/webhook', '')
    twa_url = f"{base_url}/static/twa/expense_input.html"

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="➕ Ausgabe erfassen (Web App)",
                web_app=WebAppInfo(url=twa_url)
            )
        ],
        [
            InlineKeyboardButton(text="📊 Dashboard & Analyse", callback_data="view_stats"),
            InlineKeyboardButton(text="📅 Abos verwalten", callback_data="view_subscriptions")
        ],
        [
            InlineKeyboardButton(text="💎 Premium (1 Monat GRATIS)", callback_data="upgrade_premium")
        ]
    ])

    return keyboard


def get_stats_keyboard() -> InlineKeyboardMarkup:
    """Stats view keyboard"""
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="📅 Woche", callback_data="stats_week"),
            InlineKeyboardButton(text="📆 Monat", callback_data="stats_month"),
            InlineKeyboardButton(text="📈 Jahr", callback_data="stats_year")
        ],
        [
            InlineKeyboardButton(text="🔙 Zurück", callback_data="back_to_main")
        ]
    ])

    return keyboard