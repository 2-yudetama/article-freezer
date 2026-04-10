from collections.abc import Awaitable, Callable

from fastapi import Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.services.error import (
    ErrorResponse,
    UnauthorizedError,
)


def _format_validation_error_detail(error: object) -> str:
    """RequestValidationError の1件分を表示用文字列へ整形する"""

    if not isinstance(error, dict):
        return "Validation error."

    loc = error.get("loc", [])
    msg = error.get("msg", "Validation error.")

    formatted_loc = ".".join(str(item) for item in loc)
    return f"{formatted_loc}: {msg}"


def _map_exception_to_response(
    exc: Exception,
) -> tuple[int, ErrorResponse]:
    """例外を API レスポンス用の status code と content に変換する"""

    if isinstance(exc, RequestValidationError):
        details = [
            _format_validation_error_detail(error) for error in exc.errors()
        ]
        return (
            status.HTTP_400_BAD_REQUEST,
            ErrorResponse(
                name=exc.__class__.__name__,
                message="Request validation failed.",
                details=details,
            ),
        )

    if isinstance(exc, UnauthorizedError):
        return (
            status.HTTP_401_UNAUTHORIZED,
            ErrorResponse(
                name=exc.__class__.__name__,
                message=exc.message,
            ),
        )

    return (
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        ErrorResponse(
            name=exc.__class__.__name__,
            message="Internal server error.",
        ),
    )


class ExceptionMiddleware(BaseHTTPMiddleware):
    """エラーレスポンス用ミドルウェア"""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        try:
            return await call_next(request)
        except Exception as exc:
            status_code, content = _map_exception_to_response(exc)
            return JSONResponse(
                status_code=status_code,
                content=content.model_dump(mode="json"),
            )
