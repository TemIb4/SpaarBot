"""
Monitoring and Observability
Structured logging, metrics, and performance tracking for production
"""
import time
import logging
import json
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class StructuredLogger:
    """
    Structured logger for production environments
    Outputs JSON-formatted logs for easy parsing by log aggregators
    """

    @staticmethod
    def _format_log(
        level: str,
        message: str,
        extra: Optional[Dict[str, Any]] = None
    ) -> str:
        """Format log entry as JSON"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            "service": "spaarbot",
        }

        if extra:
            log_entry.update(extra)

        return json.dumps(log_entry)

    @classmethod
    def info(cls, message: str, **kwargs):
        """Log info level message"""
        logger.info(cls._format_log("INFO", message, kwargs))

    @classmethod
    def warning(cls, message: str, **kwargs):
        """Log warning level message"""
        logger.warning(cls._format_log("WARNING", message, kwargs))

    @classmethod
    def error(cls, message: str, **kwargs):
        """Log error level message"""
        logger.error(cls._format_log("ERROR", message, kwargs))

    @classmethod
    def debug(cls, message: str, **kwargs):
        """Log debug level message"""
        logger.debug(cls._format_log("DEBUG", message, kwargs))


class MetricsCollector:
    """
    Lightweight metrics collector for application monitoring
    Tracks request counts, latencies, and errors
    """

    def __init__(self):
        self.metrics: Dict[str, Any] = {
            "requests_total": 0,
            "requests_by_endpoint": {},
            "requests_by_status": {},
            "total_latency_ms": 0.0,
            "errors_total": 0,
            "rate_limit_hits": 0,
            "cache_hits": 0,
            "cache_misses": 0,
        }
        self.start_time = time.time()

    def record_request(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        duration_ms: float
    ):
        """Record a request"""
        self.metrics["requests_total"] += 1

        # Track by endpoint
        endpoint_key = f"{method} {endpoint}"
        if endpoint_key not in self.metrics["requests_by_endpoint"]:
            self.metrics["requests_by_endpoint"][endpoint_key] = {
                "count": 0,
                "total_latency_ms": 0.0,
                "min_latency_ms": float("inf"),
                "max_latency_ms": 0.0,
            }

        ep_metrics = self.metrics["requests_by_endpoint"][endpoint_key]
        ep_metrics["count"] += 1
        ep_metrics["total_latency_ms"] += duration_ms
        ep_metrics["min_latency_ms"] = min(ep_metrics["min_latency_ms"], duration_ms)
        ep_metrics["max_latency_ms"] = max(ep_metrics["max_latency_ms"], duration_ms)

        # Track by status code
        status_category = f"{status_code // 100}xx"
        self.metrics["requests_by_status"][status_category] = (
            self.metrics["requests_by_status"].get(status_category, 0) + 1
        )

        # Track errors
        if status_code >= 400:
            self.metrics["errors_total"] += 1

        # Track total latency
        self.metrics["total_latency_ms"] += duration_ms

    def record_cache_hit(self):
        """Record a cache hit"""
        self.metrics["cache_hits"] += 1

    def record_cache_miss(self):
        """Record a cache miss"""
        self.metrics["cache_misses"] += 1

    def record_rate_limit_hit(self):
        """Record a rate limit hit"""
        self.metrics["rate_limit_hits"] += 1

    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        uptime_seconds = time.time() - self.start_time

        # Calculate averages
        avg_latency_ms = (
            self.metrics["total_latency_ms"] / self.metrics["requests_total"]
            if self.metrics["requests_total"] > 0
            else 0.0
        )

        # Calculate cache hit rate
        total_cache_requests = (
            self.metrics["cache_hits"] + self.metrics["cache_misses"]
        )
        cache_hit_rate = (
            self.metrics["cache_hits"] / total_cache_requests
            if total_cache_requests > 0
            else 0.0
        )

        # Calculate endpoint averages
        endpoint_metrics = {}
        for endpoint, data in self.metrics["requests_by_endpoint"].items():
            endpoint_metrics[endpoint] = {
                "count": data["count"],
                "avg_latency_ms": (
                    data["total_latency_ms"] / data["count"]
                    if data["count"] > 0
                    else 0.0
                ),
                "min_latency_ms": (
                    data["min_latency_ms"]
                    if data["min_latency_ms"] != float("inf")
                    else 0.0
                ),
                "max_latency_ms": data["max_latency_ms"],
            }

        return {
            "uptime_seconds": round(uptime_seconds, 2),
            "requests_total": self.metrics["requests_total"],
            "requests_per_second": round(
                self.metrics["requests_total"] / uptime_seconds, 2
            ),
            "avg_latency_ms": round(avg_latency_ms, 2),
            "errors_total": self.metrics["errors_total"],
            "error_rate": (
                round(
                    self.metrics["errors_total"] / self.metrics["requests_total"] * 100,
                    2,
                )
                if self.metrics["requests_total"] > 0
                else 0.0
            ),
            "rate_limit_hits": self.metrics["rate_limit_hits"],
            "cache_hit_rate": round(cache_hit_rate * 100, 2),
            "requests_by_status": self.metrics["requests_by_status"],
            "top_endpoints": sorted(
                endpoint_metrics.items(),
                key=lambda x: x[1]["count"],
                reverse=True,
            )[:10],
        }

    def reset(self):
        """Reset all metrics"""
        self.__init__()


# Global metrics collector
_metrics_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> Optional[MetricsCollector]:
    """Get global metrics collector"""
    return _metrics_collector


def set_metrics_collector(collector: MetricsCollector):
    """Set global metrics collector"""
    global _metrics_collector
    _metrics_collector = collector


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for logging all requests with timing and metadata
    """

    def __init__(self, app, enable_metrics: bool = True):
        super().__init__(app)
        self.enable_metrics = enable_metrics

    async def dispatch(self, request: Request, call_next):
        """Log and time each request"""
        start_time = time.time()

        # Generate request ID
        request_id = f"{int(start_time * 1000)}-{id(request)}"

        # Log request
        StructuredLogger.info(
            "Request started",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown",
        )

        # Process request
        try:
            response: Response = await call_next(request)
        except Exception as e:
            # Log exception
            duration_ms = (time.time() - start_time) * 1000
            StructuredLogger.error(
                "Request failed with exception",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                duration_ms=round(duration_ms, 2),
                error=str(e),
                error_type=type(e).__name__,
            )

            # Record error in metrics
            if self.enable_metrics:
                collector = get_metrics_collector()
                if collector:
                    collector.record_request(
                        request.url.path, request.method, 500, duration_ms
                    )

            raise

        # Calculate duration
        duration_ms = (time.time() - start_time) * 1000

        # Add custom headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration_ms:.2f}ms"

        # Log response
        log_level = "warning" if response.status_code >= 400 else "info"
        log_method = getattr(StructuredLogger, log_level)
        log_method(
            "Request completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
        )

        # Record metrics
        if self.enable_metrics:
            collector = get_metrics_collector()
            if collector:
                collector.record_request(
                    request.url.path,
                    request.method,
                    response.status_code,
                    duration_ms,
                )

        return response


class HealthChecker:
    """
    Health check utilities for monitoring service status
    """

    def __init__(self):
        self.components: Dict[str, Any] = {}

    def register_component(
        self, name: str, check_func: callable, critical: bool = True
    ):
        """
        Register a component for health checking

        Args:
            name: Component name
            check_func: Async function that returns (healthy: bool, message: str)
            critical: Whether this component is critical for app health
        """
        self.components[name] = {
            "check": check_func,
            "critical": critical,
        }

    async def check_health(self) -> Dict[str, Any]:
        """
        Check health of all registered components

        Returns:
            Health status dict with overall status and component details
        """
        results = {}
        overall_healthy = True

        for name, component in self.components.items():
            try:
                healthy, message = await component["check"]()
                results[name] = {
                    "healthy": healthy,
                    "message": message,
                }

                if not healthy and component["critical"]:
                    overall_healthy = False

            except Exception as e:
                results[name] = {
                    "healthy": False,
                    "message": f"Health check failed: {str(e)}",
                }
                if component["critical"]:
                    overall_healthy = False

        return {
            "status": "healthy" if overall_healthy else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": results,
        }


# Global health checker
_health_checker: Optional[HealthChecker] = None


def get_health_checker() -> Optional[HealthChecker]:
    """Get global health checker"""
    return _health_checker


def set_health_checker(checker: HealthChecker):
    """Set global health checker"""
    global _health_checker
    _health_checker = checker
