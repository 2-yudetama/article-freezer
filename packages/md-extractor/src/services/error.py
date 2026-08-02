from pydantic import BaseModel


class ErrorResponse(BaseModel):
    name: str
    message: str
    details: list[str] | None = None


class LLMError(Exception):
    """LLM処理に関する例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class LLMRequestError(LLMError):
    """LLMへのリクエストに不備がある場合の例外"""


class LLMResponseError(LLMError):
    """LLMからのレスポンスを処理できない場合の例外"""


class LLMServiceUnavailableError(LLMError):
    """LLMサービスを利用できない場合の例外"""


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


class InvalidArticleUrlError(Exception):
    """記事URLをHTTPリクエスト用URLとして解釈できない場合の例外"""

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


class ArticleContentTimeoutError(Exception):
    """記事コンテンツのリクエストでタイムアウトになった場合の例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class UnsupportedArticleContentError(Exception):
    """記事コンテンツがMarkdown変換の対応形式ではない場合の例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ArticleContentConversionError(Exception):
    """記事コンテンツのMarkdown変換に失敗した場合の例外"""

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class ArticleExtractionError(Exception):
    """記事抽出に失敗した場合の例外"""

    def __init__(self, message: str, llm_error: LLMError) -> None:
        combined_message = f"{message} {llm_error.message}"
        super().__init__(combined_message)
        self.message = combined_message
        self.llm_error = llm_error


class ArticleTranslationError(Exception):
    """記事翻訳に失敗した場合の例外"""

    def __init__(self, message: str, llm_error: LLMError) -> None:
        combined_message = f"{message} {llm_error.message}"
        super().__init__(combined_message)
        self.message = combined_message
        self.llm_error = llm_error
