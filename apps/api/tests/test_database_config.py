from app.core.config import Settings
from sqlalchemy import create_engine


def test_unqualified_postgresql_urls_use_psycopg() -> None:
    settings = Settings(_env_file=None, database_url="postgresql://user:password@host:5432/database")

    assert settings.database_url == "postgresql+psycopg://user:password@host:5432/database"
    assert create_engine(settings.database_url).dialect.driver == "psycopg"


def test_psycopg_database_urls_are_preserved() -> None:
    url = "postgresql+psycopg://user:password@host:5432/database"

    assert Settings(_env_file=None, database_url=url).database_url == url
