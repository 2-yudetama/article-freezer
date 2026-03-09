from injector import inject
from pydantic import HttpUrl

from src.services.extract.port import ExtractGateway


class ExtractGatewayAdapter(ExtractGateway):
    """外部サービスを利用したユースケース要求の実装"""

    @inject
    def __init__(self) -> None:
        super().__init__()

    def validate_url_safety(self, url: HttpUrl) -> None:
        """URLの安全性検証

        以下のチェックをする
        1. httpsチェック
        2. localhost・IP直書きURLの禁止
        3. ドメインのDNS解決結果チェック
        """

    async def fetch_content(self, url: HttpUrl) -> None:
        """URLからコンテンツを取得する"""

    def convert_to_markdown(self) -> None:
        """取得したコンテンツをマークダウン化する"""
