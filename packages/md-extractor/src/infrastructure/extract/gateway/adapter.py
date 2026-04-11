import ipaddress
import socket
from email.message import Message

import httpx
from injector import inject
from loguru import logger
from pydantic import HttpUrl

from src.services.error import (
    ArticleContentFetchError,
    ArticleContentRequestError,
    UnsafeArticleUrlError,
)
from src.services.extract.model import FetchedContent
from src.services.extract.port import ExtractGateway


class ExtractGatewayAdapter(ExtractGateway):
    """外部サービスを利用したユースケース要求の実装"""

    @inject
    def __init__(self) -> None:
        super().__init__()

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

    def convert_to_markdown(self) -> None:
        """取得したコンテンツをマークダウン化する"""
