from openai import (
    APIConnectionError,
    APIResponseValidationError,
    APITimeoutError,
    BadRequestError,
    ConflictError,
    InternalServerError,
    RateLimitError,
    UnprocessableEntityError,
)
from pydantic import ValidationError

from src.services.error import (
    LLMError,
    LLMRequestError,
    LLMResponseError,
    LLMServiceUnavailableError,
)


def _is_input_error(error: BadRequestError | UnprocessableEntityError) -> bool:
    """OpenAIへの入力値に起因するエラーかを判定する"""

    param = error.param
    if param is None:
        return False

    return (
        param == "input"
        or param.startswith("input.")
        or param.startswith("input[")
    )


def map_llm_exception(exc: Exception) -> LLMError | None:
    """LLM処理中の例外をサービス層の例外へ変換する"""

    if isinstance(exc, APITimeoutError):
        return LLMServiceUnavailableError("The LLM request timed out.")

    if isinstance(exc, APIConnectionError):
        return LLMServiceUnavailableError(
            "Could not connect to the LLM service."
        )

    if isinstance(exc, RateLimitError):
        return LLMServiceUnavailableError(
            "The LLM service rate limit was exceeded."
        )

    if isinstance(exc, InternalServerError):
        return LLMServiceUnavailableError(
            "The LLM service returned an internal error."
        )

    if isinstance(exc, ConflictError):
        return LLMServiceUnavailableError(
            "The LLM request could not be completed due to a conflict."
        )

    if isinstance(exc, (BadRequestError, UnprocessableEntityError)):
        if _is_input_error(exc):
            return LLMRequestError("The LLM could not process the input.")

        return None

    if isinstance(exc, (APIResponseValidationError, ValidationError)):
        return LLMResponseError(
            "The LLM response could not be processed."
        )

    return None
