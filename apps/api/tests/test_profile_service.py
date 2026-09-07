import asyncio
from pathlib import Path

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.documents import read_documents, upload_application_document
from app.core.config import settings
from app.core.database import Base
from app.models.application import ApplicationDocument
from app.models.profile import Document, DocumentSource, DocumentType
from app.models.service import Service, ServiceDocumentRequirement, ServiceStatus, ServiceType
from app.schemas.profile import ProfileUpdate
from app.services.application_engine import (
    create_application,
    determine_missing_requirements,
    document_type_matches,
    get_application,
)
from app.services.profile_service import get_profile, list_documents, update_profile
from app.services.seed import (
    SEED_GENERIC_DOCUMENT_FILENAME,
    SEEDED_MARKSHEET_NAME,
    seed_demo_citizen,
)


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


def test_seeded_marksheet_is_system_owned_idempotent_and_hidden_from_documents_api(db: Session) -> None:
    profile = get_profile(db)
    marksheets = list(
        db.scalars(
            select(Document).where(
                Document.user_id == profile.user_id,
                Document.document_type == DocumentType.MARKSHEET,
                Document.original_filename == SEED_GENERIC_DOCUMENT_FILENAME,
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
    assert marksheet.id not in {document.id for document in read_documents(db)}

    seed_demo_citizen(db)

    assert db.scalar(
        select(func.count()).select_from(Document).where(
            Document.user_id == profile.user_id,
            Document.document_type == DocumentType.MARKSHEET,
            Document.original_filename == SEED_GENERIC_DOCUMENT_FILENAME,
        )
    ) == 1


def test_application_upload_uses_requirement_identity_and_persists_reusable_attachment(db: Session) -> None:
    db.add(
        Service(
            id="SUPPORTING_DOCUMENT_TEST",
            name="Supporting document test",
            department="Test department",
            description="Tests application document uploads.",
            service_type=ServiceType.CERTIFICATE,
            category="Certificates",
            status=ServiceStatus.OPEN,
            fee=0,
            currency="INR",
            document_requirements=[
                ServiceDocumentRequirement(document_type="OTHER", label="State supporting document", required=True)
            ],
        )
    )
    db.commit()
    application = create_application(db, "SUPPORTING_DOCUMENT_TEST")
    loaded = get_application(db, application.id)
    requirement = next(item for item in loaded.service.document_requirements if item.document_type == "OTHER")
    class SyntheticUpload:
        filename = "supporting-evidence.pdf"
        content_type = "application/pdf"

        async def read(self) -> bytes:
            return b"%PDF-1.4 synthetic supporting document"

    document = asyncio.run(
        upload_application_document(application.id, requirement.id, SyntheticUpload(), db=db)
    )

    assert document.document_type == DocumentType.OTHER
    assert document.display_name == requirement.label
    assert document.id in {item.id for item in list_documents(db)}
    assert db.scalar(
        select(ApplicationDocument).where(
            ApplicationDocument.application_id == application.id,
            ApplicationDocument.document_id == document.id,
        )
    ) is not None
    _, missing_documents, _ = determine_missing_requirements(db, get_application(db, application.id))
    assert "OTHER" not in missing_documents
