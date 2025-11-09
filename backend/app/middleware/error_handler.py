from datetime import UTC, datetime
from typing import Any

from fastapi import Request, Response, status
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Centralized error handling middleware for all API requests.

    Catches unhandled exceptions, logs them properly, and returns consistent
    error responses. Prevents silent failures and improves debugging.
    """

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        try:
            response = await call_next(request)
            return response

        except HTTPException as exc:
            logger.warning(f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}")
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.detail, "timestamp": datetime.now(UTC).isoformat()},
            )

        except RequestValidationError as exc:
            logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={"detail": exc.errors(), "timestamp": datetime.now(UTC).isoformat()},
            )

        except Exception as exc:
            logger.exception(f"Unhandled error on {request.method} {request.url.path}: {exc}")

            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "Internal server error",
                    "error_type": type(exc).__name__,
                    "timestamp": datetime.now(UTC).isoformat(),
                },
            )
