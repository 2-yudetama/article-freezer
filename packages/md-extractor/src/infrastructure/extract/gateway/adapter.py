import ipaddress
import socket
from email.message import Message
from io import BytesIO

import httpx
from injector import inject
from loguru import logger
from markitdown import MarkItDown, StreamInfo
from openai import AsyncOpenAI
from pydantic import HttpUrl

from src.services.error import (
    ArticleContentConversionError,
    ArticleContentFetchError,
    ArticleContentRequestError,
    ArticleExtractionError,
    UnsafeArticleUrlError,
)
from src.services.extract.model import ExtractedArticle, FetchedContent
from src.services.extract.port import ExtractGateway
from src.settings import settings
from src.utils.usage_cost import calculate_openai_usage_cost


class ExtractGatewayAdapter(ExtractGateway):
    """外部サービスを利用したユースケース要求の実装"""

    @inject
    def __init__(self) -> None:
        super().__init__()
        self.__markdown_converter = MarkItDown()
        self.__openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

    def _resolve_host_ips(
        self, host: str
    ) -> set[ipaddress.IPv4Address | ipaddress.IPv6Address]:
        # ホスト名を名前解決して、実際に接続先となる IP 一覧を取得する
        try:
            addrinfo = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
        except socket.gaierror as exc:
            raise UnsafeArticleUrlError(
                "Could not resolve the URL host."
            ) from exc

        resolved_ips: set[ipaddress.IPv4Address | ipaddress.IPv6Address] = (
            set()
        )
        for family, _, _, _, sockaddr in addrinfo:
            if family == socket.AF_INET:
                resolved_ips.add(ipaddress.ip_address(sockaddr[0]))
            elif family == socket.AF_INET6:
                resolved_ips.add(ipaddress.ip_address(sockaddr[0]))

        if not resolved_ips:
            raise UnsafeArticleUrlError("Could not resolve the URL host.")

        return resolved_ips

    def _parse_ip_address(
        self, host: str
    ) -> ipaddress.IPv4Address | ipaddress.IPv6Address | None:
        try:
            return ipaddress.ip_address(host)
        except ValueError:
            return None

    def _is_unsafe_resolved_ip(
        self, address: ipaddress.IPv4Address | ipaddress.IPv6Address
    ) -> bool:
        # 内部ネットワーク向けや特殊用途のアドレスは外部記事URLとして扱わない
        return any(
            (
                address.is_private,
                address.is_loopback,
                address.is_link_local,
                address.is_reserved,
                address.is_multicast,
                address.is_unspecified,
            )
        )

    def _parse_content_type(
        self, content_type: str | None
    ) -> tuple[str | None, str | None]:
        if content_type is None:
            return None, None

        message = Message()
        message["content-type"] = content_type

        return message.get_content_type(), message.get_content_charset()

    def validate_url_safety(self, url: HttpUrl) -> None:
        """URLの安全性検証

        以下のチェックをする
        1. httpsチェック
        2. localhost・IP直書きURLの禁止
        3. ドメインのDNS解決結果チェック
        """

        if url.scheme != "https":
            raise UnsafeArticleUrlError("Only https URLs are allowed.")

        host = url.host
        if host is None:
            raise UnsafeArticleUrlError("Host is required.")

        normalized_host = host.lower()
        if normalized_host == "localhost" or normalized_host.endswith(
            ".localhost"
        ):
            raise UnsafeArticleUrlError("Localhost URLs are not allowed.")

        # IP 直書き URL は DNS 解決を介さずその場で拒否する
        if self._parse_ip_address(normalized_host) is not None:
            raise UnsafeArticleUrlError("IP address URLs are not allowed.")

        # ドメイン指定 URL は名前解決した実アドレスが安全かどうかで判定する
        resolved_ips = self._resolve_host_ips(normalized_host)

        if any(
            self._is_unsafe_resolved_ip(address) for address in resolved_ips
        ):
            raise UnsafeArticleUrlError(
                "Resolved host points to an unsafe IP address."
            )

        logger.info("This URL is safety")

    async def fetch_content(self, url: HttpUrl) -> FetchedContent:
        """URLからコンテンツを取得する"""

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url=url.encoded_string())
                response.raise_for_status()
            except httpx.RequestError as exc:
                raise ArticleContentRequestError(
                    "Could not fetch the article content."
                ) from exc
            except httpx.HTTPStatusError as exc:
                raise ArticleContentFetchError(
                    "The article URL returned an unsuccessful response."
                ) from exc

        mimetype, charset = self._parse_content_type(
            response.headers.get("content-type")
        )

        logger.info(
            "Fetched content",
            url=str(url),
            content_length=len(response.content),
            mimetype=mimetype,
            charset=charset,
        )
        return FetchedContent(
            body=response.content,
            mimetype=mimetype,
            charset=charset,
            url=url,
        )

    def convert_to_markdown(self, fetched_content: FetchedContent) -> str:
        """取得したコンテンツをマークダウン化する"""

        stream_info = StreamInfo(
            mimetype=fetched_content.mimetype,
            charset=fetched_content.charset,
            url=str(fetched_content.url),
        )

        try:
            result = self.__markdown_converter.convert_stream(
                BytesIO(fetched_content.body), stream_info=stream_info
            )
        except Exception as exc:
            raise ArticleContentConversionError(
                "Could not convert the article content to Markdown."
            ) from exc

        logger.info(
            "Converted content to Markdown",
            url=str(fetched_content.url),
            text_length=len(result.text_content),
        )

        return result.text_content

    async def extract_article(self, markdown: str) -> ExtractedArticle:
        """MarkdownからLLMを使って記事を抽出する"""

        try:
            response = await self.__openai_client.responses.parse(
                model=settings.openai_model,
                instructions=(
                    "あなたは構造化データ抽出の専門家です。"
                    "MarkItDownでMarkdownに変換されたWebサイトの記事テキストが与えられるので、"
                    "指定された構造に変換してください。"
                ),
                input=markdown,
                text_format=ExtractedArticle,
            )
        except Exception as exc:
            raise ArticleExtractionError(
                "Could not extract the article content."
            ) from exc

        extracted_article = response.output_parsed
        if extracted_article is None:
            raise ArticleExtractionError(
                "Could not parse the extracted article content."
            )

        usage_seconds = (
            None
            if response.completed_at is None
            else response.completed_at - response.created_at
        )

        logger.info(
            "Extracted article from Markdown",
            title=extracted_article.title,
            published_date=str(extracted_article.published_date),
            content_length=len(extracted_article.content),
            model=settings.openai_model,
            usage_seconds=usage_seconds,
            usage_cost=calculate_openai_usage_cost(
                settings.openai_model, response.usage
            ),
        )

        return extracted_article
