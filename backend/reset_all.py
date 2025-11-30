# reset_all.py - ПОЛНАЯ ОЧИСТКА

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.database import async_session_maker
from app.db.models import Transaction
from sqlalchemy import delete


async def reset_all():
    """Удалить ВСЕ транзакции"""
    async with async_session_maker() as db:
        try:
            result = await db.execute(delete(Transaction))
            await db.commit()
            print(f"✅ Удалено {result.rowcount} транзакций")
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            await db.rollback()


if __name__ == "__main__":
    print("🗑️  ПОЛНАЯ ОЧИСТКА ТРАНЗАКЦИЙ...")
    asyncio.run(reset_all())
    print("✅ Готово! Теперь попробуй синхронизацию заново")