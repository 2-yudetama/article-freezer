from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

type LogLevel = Literal[
    "TRACE",
    "DEBUG",
    "INFO",
    "SUCCESS",
    "WARNING",
    "ERROR",
    "CRITICAL",
]

type LogFormat = Literal["text", "json"]

type OpenAIModel = Literal["gpt-4o-mini", "gpt-5-nano", "gpt-5.4-nano"]


class Settings(BaseSettings):
    """設定モデル"""

    # dotenv
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # API Secret Key
    api_secret_key: str

    # API Server
    server_host: str = "0.0.0.0"
    server_port: int = 8080
    hot_reload: bool = False
    log_level: LogLevel = "INFO"
    log_format: LogFormat = "text"

    # OpenAI
    openai_api_key: str
    openai_model: OpenAIModel = "gpt-4o-mini"


settings = Settings()  # type: ignore
