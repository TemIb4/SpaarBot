# backend/app/utils/time_utils.py - НОВЫЙ ФАЙЛ

"""
Утилиты для работы со временем
"""
import httpx
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def get_internet_time() -> datetime:
    """Получить точное время из интернета через WorldTimeAPI"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://worldtimeapi.org/api/timezone/Europe/Berlin")
            if response.status_code == 200:
                data = response.json()
                return datetime.fromisoformat(data["datetime"].replace('Z', '+00:00'))
    except Exception as e:
        logger.warning(f"Failed to get internet time: {e}, using system time")

    return datetime.now()