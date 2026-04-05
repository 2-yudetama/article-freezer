from typing import Literal

from pydantic import BaseModel

from src.services.extract.model import ArticleSource


class Health(BaseModel):
    status: Literal["ok"]


class ExtractReq(BaseModel):
    articleSource: ArticleSource


class ExtractRes(BaseModel):
    articleSource: ArticleSource
    title: str
    publishedDate: str | None = None
    content: str
