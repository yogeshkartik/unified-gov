from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Unified Government Services API"
    database_url: str = "sqlite:///./unified_gov.db"
    frontend_url: str = "http://localhost:3000"
    upload_dir: str = str(Path(__file__).resolve().parents[2] / "storage" / "uploads")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url", mode="before")
    @classmethod
    def use_psycopg_driver(cls, value: object) -> object:
        """Make provider PostgreSQL URLs use the project's Psycopg 3 driver."""
        if isinstance(value, str):
            if value.startswith("postgres://"):
                return "postgresql+psycopg://" + value.removeprefix("postgres://")
            if value.startswith("postgresql://"):
                return "postgresql+psycopg://" + value.removeprefix("postgresql://")
        return value


settings = Settings()
