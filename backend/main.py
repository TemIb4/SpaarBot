"""Main application entry point"""
import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.core.config import get_settings
from app.db.database import init_db, get_db
from app.bot.handlers import start
from app.api.v1.endpoints import transactions, ai, auth, twa
from app.api.v1.endpoints import ai

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

        # Middleware для инъекции database session
        @dp.update.middleware()
        async def db_session_middleware(handler, event, data):
            """Inject database session into handlers"""
            async for session in get_db():
                data['db'] = session
                return await handler(event, data)

        # Register only start router
        dp.include_router(start.router)

    return bot, dp

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for FastAPI"""
    # Startup
    logger.info("Starting SpaarBot...")
    await init_db()
    logger.info("Database initialized")

    # Get bot and dispatcher
    bot_instance, dp_instance = get_bot_and_dispatcher()

    # Start bot polling in background
    asyncio.create_task(dp_instance.start_polling(bot_instance))
    logger.info("Bot polling started")

    yield

    # Shutdown
    logger.info("Shutting down...")
    if bot_instance:
        await bot_instance.session.close()

# Create FastAPI app
app = FastAPI(
    title="SpaarBot API",
    description="AI-powered personal finance assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CSP middleware for Telegram WebApp
class CSPMiddleware(BaseHTTPMiddleware):
    """Content Security Policy middleware for Telegram WebApp compatibility"""
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Only add CSP for /app routes (frontend)
        if request.url.path.startswith('/app'):
            response.headers['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https:; "
                "frame-ancestors 'self' https://web.telegram.org https://telegram.org;"
            )

        return response

app.add_middleware(CSPMiddleware)

# Mount static files for TWA
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Mount frontend build (React app)
FRONTEND_DIR = BASE_DIR / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/app", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
    logger.info(f"Frontend mounted at /app from {FRONTEND_DIR}")
else:
    logger.warning(f"Frontend dist directory not found at {FRONTEND_DIR}")

# Include API routers
app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["auth"])
app.include_router(transactions.router, prefix=f"{settings.API_V1_PREFIX}/transactions", tags=["transactions"])
app.include_router(ai.router, prefix=f"{settings.API_V1_PREFIX}/ai", tags=["ai"])
app.include_router(twa.router, prefix=f"{settings.API_V1_PREFIX}/twa", tags=["twa"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "SpaarBot API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )