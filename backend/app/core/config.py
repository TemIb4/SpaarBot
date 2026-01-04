# config.py - ИСПРАВЛЕННАЯ ВЕРСИЯ

"""Application configuration"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment"""

    # Telegram
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_WEBHOOK_URL: str = ""

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./spaarbot.db"

    # API
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str

    # PayPal Configuration - ИСПРАВЛЕНО: убрал os.getenv, pydantic сам прочитает
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"
    PAYPAL_WEBHOOK_ID: str = ""
    PAYPAL_PREMIUM_PLAN_ID: str = ""

    # AI
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "mixtral-8x7b-32768"

    # Celery & Redis
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Redis for Caching & Rate Limiting
    REDIS_URL: str = "redis://localhost:6379/1"
    REDIS_CACHE_TTL: int = 300  # 5 minutes default cache TTL

    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000

    # Open Banking (GoCardless)
    GOCARDLESS_SECRET_ID: str = ""
    GOCARDLESS_SECRET_KEY: str = ""
    GOCARDLESS_MODE: str = "sandbox"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = False  # Set to True only in .env for development

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS string to list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


_settings = None


def get_settings() -> Settings:
    """Get cached settings instance"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings