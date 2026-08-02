from abc import ABC, abstractmethod

from src.services.translate.model import TranslatedMarkdown


class TranslateGateway(ABC):
    """外部サービスを利用したユースケース要求"""

    @abstractmethod
    async def translate_markdown(self, markdown: str) -> TranslatedMarkdown:
        """Markdownを日本語に翻訳する"""
        raise NotImplementedError
