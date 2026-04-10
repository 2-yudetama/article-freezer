from src.services.extract import ExtractGateway
from src.services.extract.model import Article, ArticleSource


class ExtractUsecase:
    def __init__(self, gateway: ExtractGateway) -> None:
        self.__extract_gateway = gateway

    async def extract_from_source(
        self, article_source: ArticleSource
    ) -> Article:
        """記事ソースから記事抽出"""

        # 1. URLのバリデーション
        self.__extract_gateway.validate_url_safety(article_source.url)

        # 2. URLからコンテンツを取得

        # 3. MarkItDownでMarkdownに変換

        return Article(
            article_source=article_source,
            title="未抽出",
            published_date=None,
            content="未抽出",
        )
