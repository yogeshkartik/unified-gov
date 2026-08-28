from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine_options: dict[str, object] = {}
if settings.database_url.startswith("sqlite"):
    engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_document_metadata_columns() -> None:
    """Add document metadata to pre-existing local SQLite prototype databases."""
    if engine.dialect.name != "sqlite" or "documents" not in inspect(engine).get_table_names():
        return
    existing = {column["name"] for column in inspect(engine).get_columns("documents")}
    columns = {
        "display_name": "VARCHAR(100)", "original_filename": "VARCHAR(255)",
        "stored_filename": "VARCHAR(255)", "mime_type": "VARCHAR(100)", "size_bytes": "INTEGER",
    }
    with engine.begin() as connection:
        for name, definition in columns.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE documents ADD COLUMN {name} {definition}"))
    profile_columns = {"alternate_mobile": "VARCHAR(20)", "marital_status": "VARCHAR(50)", "guardian_name": "VARCHAR(255)", "guardian_relationship": "VARCHAR(100)", "ews_status": "VARCHAR(30)", "ex_serviceman_status": "VARCHAR(30)", "minority_status": "VARCHAR(30)", "highest_qualification": "VARCHAR(100)", "current_education_status": "VARCHAR(100)", "current_course": "VARCHAR(255)", "current_institution": "VARCHAR(255)", "employment_status": "VARCHAR(50)", "occupation": "VARCHAR(100)", "annual_family_income_range": "VARCHAR(50)", "preferred_language": "VARCHAR(20)"}
    existing_profile = {column["name"] for column in inspect(engine).get_columns("profiles")}
    with engine.begin() as connection:
        for name, definition in profile_columns.items():
            if name not in existing_profile:
                connection.execute(text(f"ALTER TABLE profiles ADD COLUMN {name} {definition}"))
