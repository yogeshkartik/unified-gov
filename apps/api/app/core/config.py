from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    app_name: str = "Unified Government Services API"
    database_url: str = "sqlite:///./unified_gov.db"
    frontend_url: str = "http://localhost:3000"
    upload_dir: str = str(Path(__file__).resolve().parents[2] / "storage" / "uploads")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
