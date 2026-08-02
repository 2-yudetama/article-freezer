from datetime import date
from typing import Literal

from pydantic import BaseModel, Field

from src.services.extract.model import ArticleSource


class Health(BaseModel):
    status: Literal["ok"]


class ExtractReq(BaseModel):
    articleSource: ArticleSource


class ExtractRes(BaseModel):
    articleSource: ArticleSource
    title: str
    publishedDate: date | None = None
    content: str


class TranslateReq(BaseModel):
    markdown: str = Field(min_length=1)


class TranslateRes(BaseModel):
    sourceLanguage: str
    translatedMarkdown: str | None
