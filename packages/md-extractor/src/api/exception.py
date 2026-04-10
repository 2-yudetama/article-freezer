from collections.abc import Awaitable, Callable
from uuid import uuid4

from fastapi import Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware

from src.services.error import (
    ErrorResponse,
    UnauthorizedError,
    UnsafeArticleUrlError,
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

    if isinstance(exc, UnsafeArticleUrlError):
        return (
            status.HTTP_400_BAD_REQUEST,
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
        request_id = str(uuid4())
        is_health_check = request.url.path == "/api/health"

        with logger.contextualize(request_id=request_id):
            if not is_health_check:
                logger.info(
                    "Request started: {method} {path}",
                    method=request.method,
                    path=request.url.path,
                )

            try:
                response = await call_next(request)
            except Exception as exc:
                status_code, content = _map_exception_to_response(exc)

                # クライアントエラーとサーバエラーでログを分岐
                if status_code >= status.HTTP_500_INTERNAL_SERVER_ERROR:
                    logger.opt(exception=exc).error(
                        "Unhandled exception on {method} "
                        "{path}: {error_message}",
                        method=request.method,
                        path=request.url.path,
                        error_message=str(exc),
                    )
                else:
                    logger.warning(
                        "Request failed with status {status_code} "
                        "on {method} {path}: {error_name}: {error_message}",
                        status_code=status_code,
                        method=request.method,
                        path=request.url.path,
                        error_name=exc.__class__.__name__,
                        error_message=str(exc),
                    )

                response = JSONResponse(
                    status_code=status_code,
                    content=content.model_dump(mode="json"),
                )

            response.headers["X-Request-ID"] = request_id

            if not is_health_check:
                logger.info(
                    "Request finished with status {status_code}: "
                    "{method} {path}",
                    status_code=response.status_code,
                    method=request.method,
                    path=request.url.path,
                )

            return response
