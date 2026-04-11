from pydantic import BaseModel


class ErrorResponse(BaseModel):
    name: str
    message: str
    details: list[str] | None = None


class UnauthorizedError(Exception):
    """認証に失敗した場合の例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class UnsafeArticleUrlError(Exception):
    """安全ではない記事URLが指定された場合の例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ArticleContentFetchError(Exception):
    """記事コンテンツの取得に失敗した場合の例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ArticleContentRequestError(Exception):
    """記事コンテンツのリクエストに失敗した場合の例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message
