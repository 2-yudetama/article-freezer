from injector import inject
from loguru import logger

from src.services.translate import TranslateGateway
from src.services.translate.model import TranslatedMarkdown


class TranslateUsecase:
    @inject
    def __init__(self, gateway: TranslateGateway) -> None:
        self.__translate_gateway = gateway

    async def translate_to_japanese(
        self, markdown: str
    ) -> TranslatedMarkdown:
        """記事Markdownを日本語に翻訳する"""

        logger.debug("Start translating Markdown")
        translated_markdown = (
            await self.__translate_gateway.translate_markdown(
                markdown=markdown
            )
        )
        logger.debug(
            "Finish translating Markdown",
            source_language=translated_markdown.source_language,
        )
        return translated_markdown
