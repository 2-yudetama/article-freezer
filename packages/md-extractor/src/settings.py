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


settings = Settings()  # type: ignore
