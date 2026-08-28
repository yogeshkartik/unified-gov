from pathlib import Path

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.documents import read_documents
from app.core.config import settings
from app.core.database import Base
from app.models.profile import Document, DocumentSource, DocumentType
from app.schemas.profile import ProfileUpdate
from app.services.application_engine import document_type_matches
from app.services.profile_service import get_profile, update_profile
from app.services.seed import SEEDED_MARKSHEET_FILENAME, SEEDED_MARKSHEET_NAME, seed_demo_citizen


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'profile.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_get_profile_returns_the_synthetic_demo_citizen(db: Session) -> None:
    profile = get_profile(db)

    assert profile.full_name == "Rahul Kumar"
    assert profile.email == "rahul.kumar@example.com"
    assert profile.addresses[0].city == "New Delhi"


def test_update_profile_persists_changes(db: Session) -> None:
    updated = update_profile(db, ProfileUpdate(nationality="Synthetic Demo Nationality"))

    assert updated.nationality == "Synthetic Demo Nationality"
    assert get_profile(db).nationality == "Synthetic Demo Nationality"


def test_seeded_marksheet_is_not_exposed_by_personal_documents_api(db: Session) -> None:
    profile = get_profile(db)
    marksheets = list(
        db.scalars(
            select(Document).where(
                Document.user_id == profile.user_id,
                Document.document_type == DocumentType.MARKSHEET,
                Document.original_filename == SEEDED_MARKSHEET_FILENAME,
            )
        )
    )

    assert len(marksheets) == 1
    marksheet = marksheets[0]
    assert marksheet.user_id == profile.user_id
    assert marksheet.name == SEEDED_MARKSHEET_NAME
    assert marksheet.display_name == SEEDED_MARKSHEET_NAME
    assert marksheet.source == DocumentSource.SYSTEM_GENERATED
    assert marksheet.mime_type == "application/pdf"
    assert marksheet.stored_filename is not None
    assert (Path(settings.upload_dir) / marksheet.stored_filename).is_file()
    assert document_type_matches("MARKSHEET", marksheet.document_type)
    personal_documents = read_documents(db)
    assert marksheet.id not in {document.id for document in personal_documents}
    assert all(document.source == DocumentSource.PROFILE_UPLOAD for document in personal_documents)

    seed_demo_citizen(db)

    assert db.scalar(
        select(func.count()).select_from(Document).where(
            Document.user_id == profile.user_id,
            Document.document_type == DocumentType.MARKSHEET,
            Document.original_filename == SEEDED_MARKSHEET_FILENAME,
        )
    ) == 1
