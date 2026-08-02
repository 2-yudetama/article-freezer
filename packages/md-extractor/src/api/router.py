from fastapi import APIRouter, Depends, status

from src.api.auth import verify_api_token
from src.api.model import (
    ExtractReq,
    ExtractRes,
    Health,
    TranslateReq,
    TranslateRes,
)
from src.dependencies import get_extract_usecase, get_translate_usecase
from src.services.extract import ExtractUsecase
from src.services.translate import TranslateUsecase

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
    article = await usecase.extract_from_source(
        article_source=req.articleSource
    )
    return ExtractRes(
        articleSource=article.article_source,
        title=article.title,
        publishedDate=article.published_date,
        content=article.content,
    )


@router.post(
    "/translate",
    status_code=status.HTTP_200_OK,
    tags=["translate"],
    # 認証
    dependencies=[Depends(verify_api_token)],
    summary="Translate Markdown",
)
async def post_translate(
    req: TranslateReq,
    usecase: TranslateUsecase = Depends(get_translate_usecase),
) -> TranslateRes:
    translated_markdown = await usecase.translate_to_japanese(
        markdown=req.markdown
    )
    return TranslateRes(
        sourceLanguage=translated_markdown.source_language,
        translatedMarkdown=translated_markdown.translated_markdown,
    )
