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
            fetched_content = await self.__extract_gateway.fetch_content(
                url=article_source.url
            )
            logger.debug("Finish fetch content from URL")

            # 3. MarkItDownでMarkdownに変換
            logger.debug("Start convert content to Markdown")
            markdown = self.__extract_gateway.convert_to_markdown(
                fetched_content=fetched_content
            )
            logger.debug("Finish convert content to Markdown")

            # 4. Markdownから記事を抽出
            logger.debug("Start extract article from Markdown")
            article = await self.__extract_gateway.extract_article(
                markdown=markdown
            )
            logger.debug("Finish extract article from Markdown")

        return Article(
            article_source=article_source,
            title=article.title,
            published_date=article.published_date,
            content=article.content,
        )
