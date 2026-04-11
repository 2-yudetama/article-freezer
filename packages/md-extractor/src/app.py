from fastapi import APIRouter, FastAPI
from fastapi.exceptions import RequestValidationError

from src.api.exception import ExceptionMiddleware, request_validation_handler
from src.api.router import router


def create_app() -> FastAPI:
    app = FastAPI()

    # middleware
    app.add_middleware(ExceptionMiddleware)

    # exception
    app.add_exception_handler(
        RequestValidationError, request_validation_handler
    )

    # router
    app_router = APIRouter(prefix="/api")
    app_router.include_router(router=router)

    app.include_router(router=app_router)

    return app
