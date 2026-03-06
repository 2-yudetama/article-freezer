from fastapi import APIRouter, Depends, status
from src.api.model import Extract, Health
from src.api.auth import verify_api_token

router = APIRouter()


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["health"],
    summary="Health check",
)
async def health_check() -> Health:
    return Health(status="ok")


@router.post(
    "/extract",
    status_code=status.HTTP_201_CREATED,
    tags=["extract"],
    # 認証
    dependencies=[Depends(verify_api_token)],
    summary="Extract Markdown from URL",
)
async def extract_md() -> Extract:
    return Extract
