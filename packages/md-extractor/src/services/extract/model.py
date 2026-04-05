from typing import Annotated, Literal

from pydantic import BaseModel, Field, HttpUrl


class UrlArticleSource(BaseModel):
    """URL を入力元にした記事ソース"""

    type: Literal["url"]
    url: HttpUrl


# 記事の入力元の種類のドメインモデル
ArticleSource = Annotated[
    UrlArticleSource,
    Field(discriminator="type"),
]


class Article(BaseModel):
    """記事のドメインモデル"""

    article_source: ArticleSource
    title: str = Field(min_length=1, max_length=255)
    published_date: str | None = None
    content: str = Field(min_length=1)
