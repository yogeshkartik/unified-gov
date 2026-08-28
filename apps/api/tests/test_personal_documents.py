import asyncio
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.documents import get_document_file
from app.core.config import settings
from app.core.database import Base
from app.models.profile import DocumentSource, DocumentType
from app.services.application_engine import create_application, determine_missing_requirements, get_application
from app.services.profile_service import delete_document, list_documents, save_upload
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'personal-documents.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


class UploadStub:
    def __init__(self, filename: str, content_type: str, content: bytes) -> None:
        self.filename = filename
        self.content_type = content_type
        self.content = content

    async def read(self) -> bytes:
        return self.content


def upload(filename: str, content_type: str, content: bytes) -> UploadStub:
    return UploadStub(filename, content_type, content)


def test_user_upload_is_personal_reusable_downloadable_and_deletable(db: Session) -> None:
    document = asyncio.run(
        save_upload(
            db,
            upload("income.pdf", "application/pdf", b"%PDF-1.4 personal upload"),
            DocumentType.INCOME_CERTIFICATE,
        )
    )

    assert document.source == DocumentSource.PROFILE_UPLOAD
    assert document.id in {item.id for item in list_documents(db)}
    assert Path(settings.upload_dir, document.stored_filename or "").is_file()
    response = get_document_file(document.id, db)
    assert response.filename == "income.pdf"

    application = create_application(db, "SCHOLARSHIP_001")
    assert "INCOME_CERTIFICATE" not in determine_missing_requirements(
        db, get_application(db, application.id)
    )[1]

    delete_document(db, document.id)
    assert document.id not in {item.id for item in list_documents(db)}
    assert not Path(settings.upload_dir, document.stored_filename or "").exists()


def test_uploaded_profile_photo_remains_available_to_profile_document_queries(db: Session) -> None:
    photo = asyncio.run(
        save_upload(
            db,
            upload("portrait.png", "image/png", b"synthetic-image"),
            DocumentType.PROFILE_PHOTO,
        )
    )

    documents = list_documents(db)
    assert photo.source == DocumentSource.PROFILE_UPLOAD
    assert photo.id in {item.id for item in documents}
    assert get_document_file(photo.id, db).filename == "portrait.png"
