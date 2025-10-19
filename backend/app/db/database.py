"""Database configuration and session management"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import get_settings

settings = get_settings()

# Create async engine with echo=False to reduce logs
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,  # ✅ Отключили подробные SQL логи
    future=True
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Base class for models
Base = declarative_base()

async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Import all models here to ensure they're registered
        from app.db import models  # noqa

        # Create all tables
        await conn.run_sync(Base.metadata.create_all)

async def get_db() -> AsyncSession:
    """Dependency for getting async database sessions"""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()