"""
Redis Caching Layer
Provides high-performance caching for expensive operations
"""
import json
import logging
import hashlib
from typing import Any, Optional, Callable
from functools import wraps
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class RedisCache:
    """
    Redis-based caching service for SpaarBot

    Features:
    - Automatic serialization/deserialization
    - TTL support for cache expiration
    - Key namespacing
    - Cache invalidation helpers
    - Graceful degradation when Redis unavailable
    """

    def __init__(self, redis_url: str, default_ttl: int = 300, enabled: bool = True):
        """
        Initialize Redis cache

        Args:
            redis_url: Redis connection URL
            default_ttl: Default time-to-live in seconds (default: 5 minutes)
            enabled: Whether caching is enabled
        """
        self.redis_url = redis_url
        self.default_ttl = default_ttl
        self.enabled = enabled
        self.redis_client: Optional[redis.Redis] = None

        # Cache key prefixes for organization
        self.PREFIXES = {
            "user": "user",
            "transaction": "txn",
            "stats": "stats",
            "ai": "ai",
            "subscription": "sub",
            "category": "cat",
        }

    async def connect(self):
        """Initialize Redis connection"""
        if not self.enabled:
            logger.info("⚠️ Caching is disabled")
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
            logger.info("✅ Cache connected to Redis")
        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis for caching: {e}")
            logger.warning("⚠️ Caching will be disabled")
            self.redis_client = None

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("✅ Cache Redis connection closed")

    def _make_key(self, prefix: str, *args, **kwargs) -> str:
        """
        Generate cache key from arguments

        Args:
            prefix: Key prefix (e.g., 'user', 'stats')
            *args: Positional arguments to include in key
            **kwargs: Keyword arguments to include in key

        Returns:
            Cache key string
        """
        # Create deterministic hash from arguments
        key_parts = [str(arg) for arg in args]
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            key_parts.extend([f"{k}={v}" for k, v in sorted_kwargs])

        key_string = ":".join(key_parts)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()[:16]

        return f"cache:{prefix}:{key_hash}"

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        if not self.enabled or not self.redis_client:
            return None

        try:
            value = await self.redis_client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(value)
            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache GET error for {key}: {e}")
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache

        Args:
            key: Cache key
            value: Value to cache (must be JSON-serializable)
            ttl: Time-to-live in seconds (None = use default_ttl)

        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or not self.redis_client:
            return False

        try:
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value)
            await self.redis_client.setex(key, ttl, serialized)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
            return True
        except Exception as e:
            logger.error(f"Cache SET error for {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete key from cache

        Args:
            key: Cache key to delete

        Returns:
            True if successful, False otherwise
        """
        if not self.enabled or not self.redis_client:
            return False

        try:
            await self.redis_client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
            return True
        except Exception as e:
            logger.error(f"Cache DELETE error for {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern

        Args:
            pattern: Redis key pattern (e.g., 'cache:user:*')

        Returns:
            Number of keys deleted
        """
        if not self.enabled or not self.redis_client:
            return 0

        try:
            count = 0
            async for key in self.redis_client.scan_iter(match=pattern):
                await self.redis_client.delete(key)
                count += 1
            logger.info(f"Cache DELETE_PATTERN: {pattern} ({count} keys)")
            return count
        except Exception as e:
            logger.error(f"Cache DELETE_PATTERN error for {pattern}: {e}")
            return 0

    async def invalidate_user_cache(self, telegram_id: int):
        """Invalidate all cache entries for a user"""
        pattern = f"cache:user:{telegram_id}:*"
        await self.delete_pattern(pattern)

    async def invalidate_stats_cache(self, telegram_id: int):
        """Invalidate stats cache for a user"""
        pattern = f"cache:stats:{telegram_id}:*"
        await self.delete_pattern(pattern)

    async def clear_all(self) -> bool:
        """Clear all cache entries (use with caution!)"""
        if not self.enabled or not self.redis_client:
            return False

        try:
            await self.redis_client.flushdb()
            logger.warning("⚠️ All cache cleared!")
            return True
        except Exception as e:
            logger.error(f"Cache CLEAR_ALL error: {e}")
            return False


# Global cache instance
_cache: Optional[RedisCache] = None


def get_cache() -> Optional[RedisCache]:
    """Get global cache instance"""
    return _cache


def set_cache(cache: RedisCache):
    """Set global cache instance"""
    global _cache
    _cache = cache


def cached(
    prefix: str,
    ttl: Optional[int] = None,
    key_builder: Optional[Callable] = None
):
    """
    Decorator for caching function results

    Args:
        prefix: Cache key prefix
        ttl: Time-to-live in seconds (None = use default)
        key_builder: Optional function to build cache key from args/kwargs

    Example:
        @cached("user", ttl=600)
        async def get_user(telegram_id: int):
            # Expensive database query
            return user

        @cached("stats", key_builder=lambda telegram_id, period: f"{telegram_id}:{period}")
        async def get_stats(telegram_id: int, period: str = "week"):
            # Expensive calculation
            return stats
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache = get_cache()

            # If cache is disabled or unavailable, just call function
            if not cache or not cache.enabled or not cache.redis_client:
                return await func(*args, **kwargs)

            # Build cache key
            if key_builder:
                key_suffix = key_builder(*args, **kwargs)
                cache_key = f"cache:{prefix}:{key_suffix}"
            else:
                cache_key = cache._make_key(prefix, *args, **kwargs)

            # Try to get from cache
            cached_value = await cache.get(cache_key)
            if cached_value is not None:
                return cached_value

            # Cache miss - call function
            result = await func(*args, **kwargs)

            # Store in cache
            await cache.set(cache_key, result, ttl)

            return result

        return wrapper
    return decorator


# Convenience decorators for common cache types
def cache_user(ttl: int = 600):
    """Cache user data (default: 10 minutes)"""
    return cached("user", ttl=ttl)


def cache_stats(ttl: int = 300):
    """Cache statistics (default: 5 minutes)"""
    return cached("stats", ttl=ttl)


def cache_ai_insights(ttl: int = 1800):
    """Cache AI insights (default: 30 minutes)"""
    return cached("ai", ttl=ttl)


def cache_transactions(ttl: int = 120):
    """Cache transaction queries (default: 2 minutes)"""
    return cached("transaction", ttl=ttl)
