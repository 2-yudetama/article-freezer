from fastapi import APIRouter, FastAPI

from src.api.route import router


def create_app() -> FastAPI:
    app = FastAPI()

    # router
    app_router = APIRouter(prefix="/api")
    app_router.include_router(router=router)

    app.include_router(router=app_router)

    return app
