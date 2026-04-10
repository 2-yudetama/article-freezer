from fastapi import APIRouter, FastAPI

from src.api.exception import ExceptionMiddleware
from src.api.router import router


def create_app() -> FastAPI:
    app = FastAPI()

    # middleware
    app.add_middleware(ExceptionMiddleware)

    # router
    app_router = APIRouter(prefix="/api")
    app_router.include_router(router=router)

    app.include_router(router=app_router)

    return app
