from fastapi import APIRouter, Depends, status

from src.api.auth import verify_api_token
from src.api.model import ExtractReq, ExtractRes, Health
from src.dependencies import get_extract_usecase
from src.services.extract import ExtractUsecase

router = APIRouter()


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    tags=["health"],
    summary="Health check",
)
async def get_health() -> Health:
    return Health(status="ok")


@router.post(
    "/extract",
    status_code=status.HTTP_201_CREATED,
    tags=["extract"],
    # 認証
    dependencies=[Depends(verify_api_token)],
    summary="Extract Markdown from URL",
)
async def post_extract(
    req: ExtractReq, usecase: ExtractUsecase = Depends(get_extract_usecase)
) -> ExtractRes:
    article = await usecase.extract_from_url(url=req.url)
    return ExtractRes(**article.model_dump())
