"""
Utility функции для SpaarBot
Форматирование, валидация, конверсия данных
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re
from decimal import Decimal

logger = logging.getLogger(__name__)


def format_currency(amount: float, currency: str = "EUR") -> str:
    """
    Форматирование суммы в валюту

    Args:
        amount: Сумма
        currency: Код валюты

    Returns:
        Отформатированная строка
    """
    if currency == "EUR":
        return f"€{amount:,.2f}"
    elif currency == "USD":
        return f"${amount:,.2f}"
    else:
        return f"{amount:,.2f} {currency}"


def parse_amount_from_text(text: str) -> Optional[float]:
    """
    Извлечь сумму из текста

    Args:
        text: Текст с суммой (например "купил кофе 4.50")

    Returns:
        Сумма или None
    """
    # Ищем числа с точкой или запятой
    pattern = r'\d+[.,]\d{1,2}|\d+'
    matches = re.findall(pattern, text)

    if not matches:
        return None

    # Берем первое число
    amount_str = matches[0].replace(',', '.')

    try:
        amount = float(amount_str)
        # Проверка на разумность
        if 0 < amount <= 1000000:
            return round(amount, 2)
    except ValueError:
        pass

    return None


def format_date(date: datetime, lang: str = 'de') -> str:
    """
    Форматировать дату в зависимости от языка

    Args:
        date: Дата
        lang: Язык ('de', 'en', 'ru', 'uk')

    Returns:
        Отформатированная дата
    """
    formats = {
        'de': '%d.%m.%Y',  # 15.11.2024
        'en': '%m/%d/%Y',  # 11/15/2024
        'ru': '%d.%m.%Y',  # 15.11.2024
        'uk': '%d.%m.%Y'  # 15.11.2024
    }

    format_str = formats.get(lang, formats['de'])
    return date.strftime(format_str)


def format_datetime(dt: datetime, lang: str = 'de') -> str:
    """
    Форматировать дату и время

    Args:
        dt: Дата и время
        lang: Язык

    Returns:
        Отформатированная строка
    """
    formats = {
        'de': '%d.%m.%Y %H:%M',
        'en': '%m/%d/%Y %I:%M %p',
        'ru': '%d.%m.%Y %H:%M',
        'uk': '%d.%m.%Y %H:%M'
    }

    format_str = formats.get(lang, formats['de'])
    return dt.strftime(format_str)


def get_date_range_for_period(period: str) -> Tuple[datetime, datetime]:
    """
    Получить диапазон дат для периода

    Args:
        period: 'today', 'week', 'month', 'year'

    Returns:
        (start_date, end_date)
    """
    now = datetime.now()

    if period == 'today':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now

    elif period == 'week':
        start = now - timedelta(days=7)
        end = now

    elif period == 'month':
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now

    elif period == 'year':
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now

    else:
        # Default to week
        start = now - timedelta(days=7)
        end = now

    return start, end


def calculate_percentage_change(old_value: float, new_value: float) -> float:
    """
    Вычислить процент изменения

    Args:
        old_value: Старое значение
        new_value: Новое значение

    Returns:
        Процент изменения (-100 до +∞)
    """
    if old_value == 0:
        return 100.0 if new_value > 0 else 0.0

    return ((new_value - old_value) / old_value) * 100


def group_transactions_by_category(transactions: List[Dict]) -> Dict[str, float]:
    """
    Сгруппировать транзакции по категориям

    Args:
        transactions: Список транзакций

    Returns:
        Dict {category_name: total_amount}
    """
    grouped = {}

    for t in transactions:
        category = t.get('category_name', 'Other')
        amount = float(t.get('amount', 0))

        if category in grouped:
            grouped[category] += amount
        else:
            grouped[category] = amount

    return grouped


def get_top_categories(transactions: List[Dict], limit: int = 5) -> List[Tuple[str, float]]:
    """
    Получить топ категорий по тратам

    Args:
        transactions: Список транзакций
        limit: Количество категорий

    Returns:
        List of (category_name, total_amount) sorted by amount
    """
    grouped = group_transactions_by_category(transactions)
    sorted_categories = sorted(grouped.items(), key=lambda x: x[1], reverse=True)
    return sorted_categories[:limit]


def calculate_daily_average(transactions: List[Dict], days: int = 30) -> float:
    """
    Вычислить средние траты в день

    Args:
        transactions: Список транзакций
        days: Количество дней для расчета

    Returns:
        Средняя сумма в день
    """
    if not transactions:
        return 0.0

    total = sum(float(t.get('amount', 0)) for t in transactions)
    return total / days if days > 0 else 0.0


def get_month_name(month: int, lang: str = 'de') -> str:
    """
    Получить название месяца

    Args:
        month: Номер месяца (1-12)
        lang: Язык

    Returns:
        Название месяца
    """
    months = {
        'de': ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
               'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        'en': ['January', 'February', 'March', 'April', 'May', 'June',
               'July', 'August', 'September', 'October', 'November', 'December'],
        'ru': ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
               'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        'uk': ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
               'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень']
    }

    month_list = months.get(lang, months['de'])
    return month_list[month - 1] if 1 <= month <= 12 else ""


def format_large_number(number: float) -> str:
    """
    Форматировать большое число (1000 -> 1K, 1000000 -> 1M)

    Args:
        number: Число

    Returns:
        Отформатированная строка
    """
    if number >= 1_000_000:
        return f"{number / 1_000_000:.1f}M"
    elif number >= 1_000:
        return f"{number / 1_000:.1f}K"
    else:
        return f"{number:.0f}"


def clean_category_name(name: str) -> str:
    """
    Очистить название категории (убрать эмодзи, лишние пробелы)

    Args:
        name: Название категории

    Returns:
        Очищенное название
    """
    # Убираем эмодзи (простой метод)
    cleaned = re.sub(r'[^\w\s-]', '', name, flags=re.UNICODE)

    # Убираем множественные пробелы
    cleaned = re.sub(r'\s+', ' ', cleaned)

    return cleaned.strip()


def validate_date_range(start_date: datetime, end_date: datetime) -> bool:
    """
    Валидация диапазона дат

    Args:
        start_date: Начальная дата
        end_date: Конечная дата

    Returns:
        True if valid
    """
    if start_date > end_date:
        return False

    # Максимум 1 год
    if (end_date - start_date).days > 365:
        return False

    # Не в будущем
    if end_date > datetime.now():
        return False

    return True


def get_greeting(lang: str = 'de') -> str:
    """
    Получить приветствие в зависимости от времени суток

    Args:
        lang: Язык

    Returns:
        Приветствие
    """
    hour = datetime.now().hour

    if hour < 12:
        greetings = {
            'de': '🌅 Guten Morgen',
            'en': '🌅 Good morning',
            'ru': '🌅 Доброе утро',
            'uk': '🌅 Доброго ранку'
        }
    elif hour < 18:
        greetings = {
            'de': '☀️ Guten Tag',
            'en': '☀️ Good afternoon',
            'ru': '☀️ Добрый день',
            'uk': '☀️ Добрий день'
        }
    else:
        greetings = {
            'de': '🌙 Guten Abend',
            'en': '🌙 Good evening',
            'ru': '🌙 Добрый вечер',
            'uk': '🌙 Добрий вечір'
        }

    return greetings.get(lang, greetings['de'])


def split_long_text(text: str, max_length: int = 4096) -> List[str]:
    """
    Разбить длинный текст на части (для Telegram message limits)

    Args:
        text: Текст
        max_length: Максимальная длина части

    Returns:
        Список частей
    """
    if len(text) <= max_length:
        return [text]

    parts = []
    current_part = ""

    for line in text.split('\n'):
        if len(current_part) + len(line) + 1 <= max_length:
            current_part += line + '\n'
        else:
            if current_part:
                parts.append(current_part)
            current_part = line + '\n'

    if current_part:
        parts.append(current_part)

    return parts


def generate_random_color() -> str:
    """
    Генерация случайного цвета для графиков

    Returns:
        HEX color code
    """
    import random
    r = random.randint(0, 255)
    g = random.randint(0, 255)
    b = random.randint(0, 255)
    return f'#{r:02x}{g:02x}{b:02x}'


def is_weekend(date: datetime) -> bool:
    """
    Проверка - выходной ли день

    Args:
        date: Дата

    Returns:
        True если суббота или воскресенье
    """
    return date.weekday() >= 5


def time_until_next_month() -> timedelta:
    """
    Время до начала следующего месяца

    Returns:
        timedelta
    """
    now = datetime.now()
    if now.month == 12:
        next_month = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        next_month = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0)

    return next_month - now


def get_financial_advice_emoji(category: str) -> str:
    """
    Получить эмодзи для категории

    Args:
        category: Название категории

    Returns:
        Emoji
    """
    emojis = {
        'food': '🍔',
        'transport': '🚗',
        'shopping': '🛍️',
        'entertainment': '🎬',
        'health': '💊',
        'bills': '📄',
        'salary': '💰',
        'other': '📦'
    }

    return emojis.get(category.lower(), '📦')