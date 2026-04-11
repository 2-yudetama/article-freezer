from datetime import date
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
    published_date: date | None = None
    content: str = Field(min_length=1)


class FetchedContent(BaseModel):
    """取得した記事コンテンツ"""

    body: bytes
    mimetype: str | None = None
    charset: str | None = None
    url: HttpUrl | str


class ExtractedArticle(BaseModel):
    """MarkItDownで変換したMarkdownから抽出した記事データ

    - Webページ全体ではなく、ユーザーが保存したい記事本文だけを表す
    - サイト共通UI、ログイン導線、ナビゲーション、フッターなどは除外する
    """

    title: str = Field(
        min_length=1,
        max_length=255,
        description="""
記事のタイトル。

含めないもの:
- サイト名
- ユーザー名
- ナビゲーション文言
""".strip(),
    )
    published_date: date | None = Field(
        default=None,
        description="""
記事の投稿日。

本文やメタ情報から特定できない場合はnull。
""".strip(),
    )
    content: str = Field(
        description="""
記事本文のMarkdown。

含めないもの:
- ログイン導線
- 検索UI
- ナビゲーション
- いいね数
- 共有ボタン
- コメント導線
- 登録案内
- フッター
- 広告
- 関連記事
- サイト運営情報

保持するもの:
- 本文中の見出し
- 段落
- 引用
- コードブロック
- 表
- 画像リンク
- 本文に必要なリンク
""".strip(),
    )
