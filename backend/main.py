"""Main application entry point"""
import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from app.api.v1.endpoints import stats
from app.core.config import get_settings
from app.db.database import init_db, get_db
from app.bot.handlers import start

# ✅ ВСЕ ENDPOINTS
from app.api.v1.endpoints import transactions, ai, auth, twa, feedback, paypal
from app.api.v1.endpoints import settings as settings_endpoint
from app.api.v1.endpoints import users, subscriptions
# ✅ НОВЫЕ ENDPOINTS (AI Insights, Bank CSV)
from app.api.v1.endpoints import ai_insights, bank
from app.api.v1.endpoints import paypal_oauth, paypal_sync, accounts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

# Paths configuration
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
(STATIC_DIR / "twa").mkdir(exist_ok=True)

# Frontend directory
FRONTEND_DIR = BASE_DIR / "frontend" / "dist"

# Global bot and dispatcher
bot = None
dp = None


def get_bot_and_dispatcher():
    """Get or create bot and dispatcher (singleton pattern)"""
    global bot, dp

    if bot is None:
        bot = Bot(
            token=settings.TELEGRAM_BOT_TOKEN,
            default=DefaultBotProperties(parse_mode=ParseMode.HTML)
        )

    if dp is None:
        dp = Dispatcher()

        @dp.update.middleware()
        async def db_session_middleware(handler, event, data):
            """Inject database session into handlers"""
            async for session in get_db():
                data['db'] = session
                return await handler(event, data)

        dp.include_router(start.router)

    return bot, dp


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI"""
    logger.info("🚀 Starting SpaarBot...")
    await init_db()
    logger.info("✅ Database initialized")

    bot_instance, dp_instance = get_bot_and_dispatcher()
    asyncio.create_task(dp_instance.start_polling(bot_instance))
    logger.info("🤖 Bot polling started")

    yield

    logger.info("Shutting down...")
    if bot_instance:
        await bot_instance.session.close()


app = FastAPI(
    title="SpaarBot API",
    description="AI-powered personal finance assistant",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CSPMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if request.url.path.startswith('/app'):
            response.headers['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https: wss: ws:; "
                "frame-ancestors 'self' https://web.telegram.org https://telegram.org;"
            )

            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            response.headers["X-Timestamp"] = str(datetime.now().timestamp())

        return response


app.add_middleware(CSPMiddleware)

logger.info("📝 Registering API routes...")

# ✅ СУЩЕСТВУЮЩИЕ РОУТЕРЫ
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
logger.info("  ✅ Auth router registered")

app.include_router(transactions.router, prefix=f"{settings.API_V1_PREFIX}/transactions", tags=["transactions"])
logger.info("  ✅ Transactions router registered")

app.include_router(ai.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["ai"])
logger.info("  ✅ AI router registered")

app.include_router(twa.router, prefix=f"{settings.API_V1_PREFIX}/twa", tags=["twa"])
logger.info("  ✅ TWA router registered")

app.include_router(feedback.router, prefix=f"{settings.API_V1_PREFIX}/feedback", tags=["feedback"])
logger.info("  ✅ Feedback router registered")

app.include_router(settings_endpoint.router, prefix=f"{settings.API_V1_PREFIX}/settings", tags=["settings"])
logger.info("  ✅ Settings router registered")

app.include_router(paypal.router, prefix=f"{settings.API_V1_PREFIX}/paypal", tags=["paypal"])
logger.info("  ✅ PayPal router registered")

app.include_router(users.router, prefix=f"{settings.API_V1_PREFIX}/users", tags=["users"])
logger.info("  ✅ Users router registered")

app.include_router(subscriptions.router, prefix=f"{settings.API_V1_PREFIX}/subscriptions", tags=["subscriptions"])
logger.info("  ✅ Subscriptions router registered")

app.include_router(paypal_oauth.router, prefix=f"{settings.API_V1_PREFIX}/paypal", tags=["paypal"])
logger.info("  ✅ PayPal OAuth router registered")

app.include_router(accounts.router, prefix=f"{settings.API_V1_PREFIX}/accounts", tags=["accounts"])
logger.info("  ✅ Accounts router registered")

app.include_router(paypal_sync.router, prefix=f"{settings.API_V1_PREFIX}/paypal/sync", tags=["paypal-sync"])
logger.info("  ✅ PayPal Sync router registered")

# ============================================
# ✅ PREMIUM FEATURES ROUTERS
# ============================================

app.include_router(ai_insights.router, prefix=f"{settings.API_V1_PREFIX}/ai-insights", tags=["ai-insights"])
logger.info("  ✅ AI Insights router registered (PREMIUM)")

app.include_router(bank.router, prefix=f"{settings.API_V1_PREFIX}/bank", tags=["bank"])
logger.info("  ✅ Bank Integration router registered (PREMIUM)")

logger.info("✅ All API routes registered successfully!")

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
logger.info(f"✅ Static files mounted at /static")

app.include_router(stats.router, prefix=f"{settings.API_V1_PREFIX}/stats", tags=["stats"])
logger.info("  ✅ Stats router registered")

if FRONTEND_DIR.exists():
    app.mount(
        "/app/assets",
        StaticFiles(directory=str(FRONTEND_DIR / "assets")),
        name="app-assets"
    )
    logger.info(f"✅ Frontend assets mounted at /app/assets")

    @app.get("/app/vite.svg")
    async def serve_vite_svg():
        file_path = FRONTEND_DIR / "vite.svg"
        if file_path.exists():
            return FileResponse(file_path)
        return {"detail": "Not Found"}

    @app.get("/app/{full_path:path}")
    async def serve_spa(full_path: str):
        logger.info(f"📝 SPA route requested: /app/{full_path}")
        index_path = FRONTEND_DIR / "index.html"

        if index_path.exists():
            return FileResponse(
                index_path,
                media_type="text/html",
                headers={
                    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                    "Pragma": "no-cache",
                    "Expires": "0",
                }
            )

        logger.error(f"❌ index.html not found at {index_path}")
        return {"detail": "Frontend not found"}

    logger.info(f"✅ SPA routing configured for /app/*")

else:
    logger.warning(f"⚠️ Frontend dist directory not found at {FRONTEND_DIR}")


@app.get("/")
async def root():
    return RedirectResponse(url="/app/")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "frontend_exists": FRONTEND_DIR.exists(),
        "registered_routes": [
            "auth", "transactions", "ai", "twa", "feedback",
            "settings", "paypal", "users", "subscriptions",
            "ai-insights", "bank"  # ✅ PREMIUM FEATURES
        ]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )