"""
Security Middleware
Enhanced security headers, input validation, and protection against common attacks
"""
import logging
import re
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    Protects against XSS, clickjacking, MIME sniffing, etc.
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # Security headers for production
        security_headers = {
            # Prevent XSS attacks
            "X-Content-Type-Options": "nosniff",
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            # Enable browser XSS protection
            "X-XSS-Protection": "1; mode=block",
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            # Permissions policy (formerly Feature-Policy)
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            # HSTS - Force HTTPS (only for production with HTTPS)
            # "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        }

        # Add headers to response
        for header, value in security_headers.items():
            response.headers[header] = value

        return response


class InputValidationMiddleware(BaseHTTPMiddleware):
    """
    Validate and sanitize input to prevent injection attacks
    """

    # Patterns for common attack vectors
    SQL_INJECTION_PATTERNS = [
        r"(\bunion\b.*\bselect\b)",
        r"(\bdrop\b.*\btable\b)",
        r"(\binsert\b.*\binto\b)",
        r"(\bdelete\b.*\bfrom\b)",
        r"(\bupdate\b.*\bset\b)",
        r"(--|\#|\/\*|\*\/)",
    ]

    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<object",
        r"<embed",
    ]

    PATH_TRAVERSAL_PATTERNS = [
        r"\.\./",
        r"\.\.",
        r"%2e%2e",
    ]

    def __init__(self, app, enabled: bool = True, strict_mode: bool = False):
        """
        Initialize input validation middleware

        Args:
            app: FastAPI application
            enabled: Whether validation is enabled
            strict_mode: If True, block suspicious requests. If False, just log warnings
        """
        super().__init__(app)
        self.enabled = enabled
        self.strict_mode = strict_mode

    def _check_sql_injection(self, text: str) -> bool:
        """Check for SQL injection patterns"""
        text_lower = text.lower()
        for pattern in self.SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return True
        return False

    def _check_xss(self, text: str) -> bool:
        """Check for XSS patterns"""
        for pattern in self.XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    def _check_path_traversal(self, text: str) -> bool:
        """Check for path traversal patterns"""
        for pattern in self.PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    async def _validate_request(self, request: Request) -> Optional[str]:
        """
        Validate request for malicious input

        Returns:
            Error message if malicious input detected, None otherwise
        """
        # Check URL path
        path = str(request.url.path)
        if self._check_path_traversal(path):
            return f"Path traversal attempt detected: {path}"

        if self._check_xss(path):
            return f"XSS attempt detected in path: {path}"

        # Check query parameters
        for key, value in request.query_params.items():
            value_str = str(value)

            if self._check_sql_injection(value_str):
                return f"SQL injection attempt detected in parameter '{key}': {value_str[:50]}"

            if self._check_xss(value_str):
                return f"XSS attempt detected in parameter '{key}': {value_str[:50]}"

        # For POST/PUT requests, we can't easily check body here without consuming it
        # Body validation should be done at the Pydantic model level

        return None

    async def dispatch(self, request: Request, call_next):
        """Validate request and add security checks"""
        if not self.enabled:
            return await call_next(request)

        # Validate request
        error_message = await self._validate_request(request)

        if error_message:
            logger.warning(
                f"⚠️ Security: {error_message}",
                extra={
                    "client_ip": request.client.host if request.client else "unknown",
                    "path": request.url.path,
                    "method": request.method,
                }
            )

            if self.strict_mode:
                # Block the request
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid request detected"
                )

        # Process request
        response = await call_next(request)
        return response


class TelegramAuthMiddleware(BaseHTTPMiddleware):
    """
    Validate Telegram authentication for API endpoints
    Ensures requests come from legitimate Telegram Mini App users
    """

    def __init__(self, app, enforce: bool = False):
        """
        Initialize Telegram auth middleware

        Args:
            app: FastAPI application
            enforce: Whether to strictly enforce Telegram authentication
        """
        super().__init__(app)
        self.enforce = enforce

        # Paths that don't require Telegram auth
        self.public_paths = [
            "/health",
            "/health/detailed",
            "/metrics",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/static",
            "/app",
        ]

    def _is_public_path(self, path: str) -> bool:
        """Check if path is public"""
        return any(path.startswith(public) for public in self.public_paths)

    async def dispatch(self, request: Request, call_next):
        """Validate Telegram authentication"""
        # Skip public paths
        if self._is_public_path(request.url.path):
            return await call_next(request)

        # Check for Telegram user ID
        telegram_id = request.headers.get("X-Telegram-User-Id")

        if not telegram_id and self.enforce:
            logger.warning(
                f"⚠️ Unauthorized access attempt to {request.url.path}",
                extra={
                    "client_ip": request.client.host if request.client else "unknown",
                    "path": request.url.path,
                }
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Telegram authentication required"
            )

        # Process request
        response = await call_next(request)
        return response


def validate_telegram_init_data(init_data: str, bot_token: str) -> bool:
    """
    Validate Telegram WebApp initData
    Verifies the authenticity of data received from Telegram

    Args:
        init_data: Init data string from Telegram WebApp
        bot_token: Bot token for validation

    Returns:
        True if valid, False otherwise
    """
    import hashlib
    import hmac
    from urllib.parse import parse_qsl

    try:
        # Parse init data
        parsed_data = dict(parse_qsl(init_data))

        # Extract hash
        received_hash = parsed_data.pop("hash", None)
        if not received_hash:
            return False

        # Create data check string
        data_check_arr = [f"{k}={v}" for k, v in sorted(parsed_data.items())]
        data_check_string = "\n".join(data_check_arr)

        # Create secret key
        secret_key = hmac.new(
            b"WebAppData",
            bot_token.encode(),
            hashlib.sha256
        ).digest()

        # Calculate hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        # Compare hashes
        return calculated_hash == received_hash

    except Exception as e:
        logger.error(f"Error validating Telegram init data: {e}")
        return False
