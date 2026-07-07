from functools import lru_cache
from typing import List

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Verveo"
    app_env: str = "development"
    app_debug: bool = True
    api_v1_prefix: str = "/api/v1"

    secret_key: str = Field(min_length=16, default="change-me")
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    otp_expire_minutes: int = 10

    database_url: str

    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    frontend_url: str = "http://localhost:5173"

    google_client_id: str | None = None
    google_client_secret: str | None = None
    google_redirect_uri: str | None = None

    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str | None = None

    upload_dir: str = "uploads"
    uploads_resumes_dir: str = "uploads/resumes"
    uploads_audio_dir: str = "uploads/audio"
    uploads_video_dir: str = "uploads/video"
    chroma_dir: str = "chroma"

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    gemini_embedding_output_dimensionality: int = 256
    whisper_model_size: str = "base"
    ffmpeg_binary: str = "ffmpeg"

    max_upload_size_mb: int = 10

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
