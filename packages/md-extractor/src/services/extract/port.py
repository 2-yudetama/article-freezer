from abc import ABC, abstractmethod

from pydantic import HttpUrl


class ExtractGateway(ABC):
    """外部サービスを利用したユースケース要求"""

    @abstractmethod
    def validate_url_safety(self, url: HttpUrl) -> None:
        """URLの安全性検証

        以下のチェックをする
        1. httpsチェック
        2. localhost・IP直書きURLの禁止
        3. ドメインのDNS解決結果チェック
        """
        raise NotImplementedError

    @abstractmethod
    async def fetch_content(self, url: HttpUrl) -> None:
        """URLからコンテンツを取得する"""
        raise NotImplementedError

    @abstractmethod
    def convert_to_markdown(self) -> None:
        """取得したコンテンツをマークダウン化する"""
        raise NotImplementedError
