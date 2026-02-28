from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """設定モデル"""

    # dotenv
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # API Server
    server_host: str = "0.0.0.0"
    server_port: int = 8080
    hot_reload: bool = False


settings = Settings()  # type: ignore
