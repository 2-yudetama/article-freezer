from pydantic import HttpUrl

from src.services.extract import ExtractGateway
from src.services.extract.model import Article


class ExtractUsecase:
    def __init__(self, gateway: ExtractGateway) -> None:
        self.__extract_gateway = gateway

    async def extract_from_url(self, url: HttpUrl) -> Article:
        """URLから記事抽出"""

        # 1. URLのバリデーション

        # 2. URLからコンテンツを取得

        # 3. MarkItDownでMarkdownに変換

        return Article()
