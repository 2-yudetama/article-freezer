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
