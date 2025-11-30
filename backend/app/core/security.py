"""
Security utilities для SpaarBot
Валидация Telegram данных, хеширование, защита от injection
"""
import hashlib
import hmac
import logging
from urllib.parse import unquote
from typing import Dict, Optional
import re

from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def validate_telegram_web_app_data(init_data: str, bot_token: Optional[str] = None) -> bool:
    """
    Валидация данных из Telegram Web App

    Args:
        init_data: Init data string from Telegram Web App
        bot_token: Bot token (optional, uses settings if not provided)

    Returns:
        True if data is valid
    """
    if not bot_token:
        bot_token = settings.TELEGRAM_BOT_TOKEN

    try:
        # Парсим init_data
        values = {}
        for item in init_data.split('&'):
            key, value = item.split('=', 1)
            values[key] = unquote(value)

        # Получаем hash
        received_hash = values.pop('hash', None)
        if not received_hash:
            logger.warning("No hash in init_data")
            return False

        # Создаем data_check_string
        data_check_string = '\n'.join(
            f"{k}={v}" for k, v in sorted(values.items())
        )

        # Вычисляем secret_key
        secret_key = hmac.new(
            "WebAppData".encode(),
            bot_token.encode(),
            hashlib.sha256
        ).digest()

        # Вычисляем hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        # Сравниваем
        is_valid = calculated_hash == received_hash

        if not is_valid:
            logger.warning("Invalid Telegram Web App data hash")

        return is_valid

    except Exception as e:
        logger.error(f"Error validating Telegram data: {e}")
        return False


def sanitize_input(text: str, max_length: int = 500) -> str:
    """
    Очистка пользовательского ввода

    Args:
        text: Входной текст
        max_length: Максимальная длина

    Returns:
        Очищенный текст
    """
    if not text:
        return ""

    # Обрезаем до максимальной длины
    text = text[:max_length]

    # Убираем потенциально опасные символы для SQL injection
    # (используем параметризованные запросы, но дополнительная защита не помешает)
    text = text.replace('\x00', '')  # null bytes

    # Убираем множественные пробелы
    text = re.sub(r'\s+', ' ', text)

    # Trim
    text = text.strip()

    return text


def validate_amount(amount: float) -> bool:
    """
    Валидация суммы транзакции

    Args:
        amount: Сумма

    Returns:
        True if valid
    """
    if not isinstance(amount, (int, float)):
        return False

    # Сумма должна быть положительной
    if amount <= 0:
        return False

    # Разумный максимум (€1,000,000)
    if amount > 1_000_000:
        return False

    # Не больше 2 знаков после запятой
    if round(amount, 2) != amount:
        return False

    return True


def validate_description(description: str) -> bool:
    """
    Валидация описания транзакции

    Args:
        description: Описание

    Returns:
        True if valid
    """
    if not description or not description.strip():
        return False

    # Минимум 1 символ, максимум 500
    if len(description) < 1 or len(description) > 500:
        return False

    # Проверка на SQL injection patterns (базовая)
    dangerous_patterns = [
        r"(\bDROP\b.*\bTABLE\b)",
        r"(\bDELETE\b.*\bFROM\b)",
        r"(\bINSERT\b.*\bINTO\b)",
        r"(\bUPDATE\b.*\bSET\b)",
        r"(--|;|\/\*|\*\/|xp_|sp_)",
    ]

    for pattern in dangerous_patterns:
        if re.search(pattern, description, re.IGNORECASE):
            logger.warning(f"Potentially dangerous input detected: {description[:50]}")
            return False

    return True


def hash_password(password: str) -> str:
    """
    Хеширование пароля (для будущего использования)

    Args:
        password: Пароль

    Returns:
        Хешированный пароль
    """
    import bcrypt
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """
    Проверка пароля

    Args:
        password: Пароль
        hashed: Хешированный пароль

    Returns:
        True if password matches
    """
    import bcrypt
    return bcrypt.checkpw(password.encode(), hashed.encode())


def generate_secure_token(length: int = 32) -> str:
    """
    Генерация безопасного токена

    Args:
        length: Длина токена

    Returns:
        Случайный токен
    """
    import secrets
    return secrets.token_urlsafe(length)


def rate_limit_key(telegram_id: int, action: str) -> str:
    """
    Генерация ключа для rate limiting

    Args:
        telegram_id: ID пользователя
        action: Тип действия

    Returns:
        Ключ для Redis
    """
    return f"ratelimit:{telegram_id}:{action}"


def is_valid_email(email: str) -> bool:
    """
    Проверка email

    Args:
        email: Email адрес

    Returns:
        True if valid
    """
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_valid_url(url: str) -> bool:
    """
    Проверка URL

    Args:
        url: URL

    Returns:
        True if valid
    """
    pattern = r'^https?://[^\s/$.?#].[^\s]*$'
    return bool(re.match(pattern, url))


def escape_markdown_v2(text: str) -> str:
    """
    Экранирование специальных символов для Telegram MarkdownV2

    Args:
        text: Текст

    Returns:
        Экранированный текст
    """
    special_chars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
    for char in special_chars:
        text = text.replace(char, f'\\{char}')
    return text


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Обрезать текст с добавлением suffix

    Args:
        text: Текст
        max_length: Максимальная длина
        suffix: Суффикс для обрезанного текста

    Returns:
        Обрезанный текст
    """
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix