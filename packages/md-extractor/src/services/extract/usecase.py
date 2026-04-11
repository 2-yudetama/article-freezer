from injector import inject
from loguru import logger

from src.services.extract import ExtractGateway
from src.services.extract.model import Article, ArticleSource


class ExtractUsecase:
    @inject
    def __init__(self, gateway: ExtractGateway) -> None:
        self.__extract_gateway = gateway

    async def extract_from_source(
        self, article_source: ArticleSource
    ) -> Article:
        """記事ソースから記事抽出"""

        with logger.contextualize(
            article_source=article_source.model_dump(mode="json")
        ):
            # 1. URLのバリデーション
            logger.debug("Start valiate URL")
            self.__extract_gateway.validate_url_safety(url=article_source.url)
            logger.debug("Finish valiate URL")

            # 2. URLからコンテンツを取得
            logger.debug("Start fetch content from URL")
            await self.__extract_gateway.fetch_content(url=article_source.url)
            logger.debug("Finish fetch content from URL")

            # 3. MarkItDownでMarkdownに変換

        return Article(
            article_source=article_source,
            title="未抽出",
            published_date=None,
            content="未抽出",
        )
