from fastapi import APIRouter, status
from src.api.model import Extract, Health

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Health:
    return Health(status="ok")


@router.post("/extract", status_code=status.HTTP_201_CREATED)
async def extract_md() -> Extract:
    return Extract
