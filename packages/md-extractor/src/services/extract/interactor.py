from pydantic import HttpUrl
from src.services.extract.model import Article


async def extract_from_url(url: HttpUrl) -> Article:
    """URLから記事抽出"""

    # 1. URLからコンテンツを取得

    # 2. MarkItDownでMarkdownに変換

    return Article()
