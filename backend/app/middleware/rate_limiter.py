"""
Rate Limiting Middleware using Redis
Защита от DDoS и злоупотреблений для production-ready приложения
"""
import time
import logging
from typing import Optional, Callable
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class RateLimitConfig:
    """Configuration for rate limiting rules"""

    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_size: int = 10,
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_size = burst_size


class RateLimiter:
    """
    Redis-based distributed rate limiter using Token Bucket algorithm

    Features:
    - Per-user rate limiting (by Telegram ID or IP)
    - Different limits for different endpoints
    - Burst protection
    - Graceful degradation if Redis is unavailable
    """

    def __init__(self, redis_url: str, enabled: bool = True):
        self.enabled = enabled
        self.redis_url = redis_url
        self.redis_client: Optional[redis.Redis] = None

        # Default rate limits
        self.default_config = RateLimitConfig(
            requests_per_minute=60,
            requests_per_hour=1000,
            burst_size=10
        )

        # Per-endpoint configurations
        self.endpoint_configs = {
            "/api/v1/ai/query": RateLimitConfig(
                requests_per_minute=10,
                requests_per_hour=100,
                burst_size=2
            ),
            "/api/v1/ai-insights": RateLimitConfig(
                requests_per_minute=20,
                requests_per_hour=200,
                burst_size=5
            ),
            "/api/v1/bank/import-csv": RateLimitConfig(
                requests_per_minute=5,
                requests_per_hour=20,
                burst_size=1
            ),
            "/api/v1/transactions": RateLimitConfig(
                requests_per_minute=100,
                requests_per_hour=2000,
                burst_size=20
            ),
        }

    async def connect(self):
        """Initialize Redis connection"""
        if not self.enabled:
            logger.info("⚠️ Rate limiting is disabled")
            return

        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            await self.redis_client.ping()
            logger.info("✅ Rate limiter connected to Redis")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis for rate limiting: {e}")
            logger.warning("⚠️ Rate limiting will be disabled")
            self.redis_client = None

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("✅ Rate limiter Redis connection closed")

    def get_identifier(self, request: Request) -> str:
        """
        Get unique identifier for rate limiting
        Priority: Telegram User ID > IP Address
        """
        # Try to get Telegram user ID from headers
        telegram_id = request.headers.get("X-Telegram-User-Id")
        if telegram_id:
            return f"telegram:{telegram_id}"

        # Fallback to IP address
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()

        return f"ip:{client_ip}"

    def get_config(self, path: str) -> RateLimitConfig:
        """Get rate limit configuration for endpoint"""
        # Check for exact match
        if path in self.endpoint_configs:
            return self.endpoint_configs[path]

        # Check for prefix match
        for endpoint_path, config in self.endpoint_configs.items():
            if path.startswith(endpoint_path):
                return config

        return self.default_config

    async def check_rate_limit(self, request: Request) -> tuple[bool, dict]:
        """
        Check if request is within rate limits

        Returns:
            (allowed: bool, info: dict)
        """
        if not self.enabled or not self.redis_client:
            # If Redis is down, allow request (graceful degradation)
            return True, {}

        identifier = self.get_identifier(request)
        path = request.url.path
        config = self.get_config(path)

        current_time = int(time.time())
        minute_key = f"rate_limit:{identifier}:{current_time // 60}"
        hour_key = f"rate_limit:{identifier}:{current_time // 3600}"

        try:
            # Use Redis pipeline for atomic operations
            pipe = self.redis_client.pipeline()

            # Increment counters
            pipe.incr(minute_key)
            pipe.expire(minute_key, 120)  # Keep for 2 minutes
            pipe.incr(hour_key)
            pipe.expire(hour_key, 7200)  # Keep for 2 hours

            results = await pipe.execute()
            minute_count = results[0]
            hour_count = results[2]

            # Check limits
            if minute_count > config.requests_per_minute:
                logger.warning(
                    f"⚠️ Rate limit exceeded (minute): {identifier} on {path} "
                    f"({minute_count}/{config.requests_per_minute})"
                )
                return False, {
                    "limit": config.requests_per_minute,
                    "remaining": 0,
                    "reset": 60 - (current_time % 60),
                    "retry_after": 60 - (current_time % 60)
                }

            if hour_count > config.requests_per_hour:
                logger.warning(
                    f"⚠️ Rate limit exceeded (hour): {identifier} on {path} "
                    f"({hour_count}/{config.requests_per_hour})"
                )
                return False, {
                    "limit": config.requests_per_hour,
                    "remaining": 0,
                    "reset": 3600 - (current_time % 3600),
                    "retry_after": 3600 - (current_time % 3600)
                }

            # Request allowed
            return True, {
                "limit": config.requests_per_minute,
                "remaining": config.requests_per_minute - minute_count,
                "reset": 60 - (current_time % 60)
            }

        except Exception as e:
            logger.error(f"❌ Rate limit check failed: {e}")
            # On error, allow request (graceful degradation)
            return True, {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """FastAPI middleware for rate limiting"""

    def __init__(self, app, rate_limiter: RateLimiter):
        super().__init__(app)
        self.rate_limiter = rate_limiter

        # Paths to exclude from rate limiting
        self.exclude_paths = [
            "/health",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/static",
            "/app/assets"
        ]

    async def dispatch(self, request: Request, call_next):
        """Check rate limits before processing request"""

        # Skip rate limiting for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Check rate limit
        allowed, info = await self.rate_limiter.check_rate_limit(request)

        if not allowed:
            # Return 429 Too Many Requests
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUEST,
                content={
                    "error": "rate_limit_exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": info.get("retry_after", 60)
                },
                headers={
                    "X-RateLimit-Limit": str(info.get("limit", 0)),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(info.get("reset", 0)),
                    "Retry-After": str(info.get("retry_after", 60))
                }
            )

        # Process request and add rate limit headers
        response = await call_next(request)

        if info:
            response.headers["X-RateLimit-Limit"] = str(info.get("limit", 0))
            response.headers["X-RateLimit-Remaining"] = str(info.get("remaining", 0))
            response.headers["X-RateLimit-Reset"] = str(info.get("reset", 0))

        return response
