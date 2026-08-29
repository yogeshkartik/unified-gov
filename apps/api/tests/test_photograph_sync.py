import asyncio
from io import BytesIO

from fastapi import UploadFile
from starlette.datastructures import Headers
import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.models.application import ApplicationDocument
from app.models.profile import Document, DocumentSource, DocumentType
from app.services.application_document_service import attach_my_documents
from app.services.application_engine import create_application, determine_missing_requirements, get_application
from app.services.profile_service import delete_document, get_profile, list_documents, save_upload
from app.services.seed import seed_demo_citizen, seed_demo_services


def image_upload(filename: str = "photo.png") -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(b"\x89PNG\r\n\x1a\nphoto-content"),
        headers=Headers({"content-type": "image/png"}),
    )


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'photograph.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_photograph_is_a_single_canonical_profile_and_document_record(db: Session) -> None:
    photograph = asyncio.run(save_upload(db, image_upload(), DocumentType.PHOTOGRAPH))

    assert photograph.id == get_profile(db).profile_photo.id
    assert photograph.id in {document.id for document in list_documents(db)}
    assert db.scalar(select(func.count()).select_from(Document).where(Document.document_type == DocumentType.PHOTOGRAPH)) == 1

    replacement = asyncio.run(save_upload(db, image_upload("new-photo.png"), DocumentType.PHOTOGRAPH))
    assert replacement.id == photograph.id
    assert replacement.original_filename == "new-photo.png"
    assert db.scalar(select(func.count()).select_from(Document).where(Document.document_type == DocumentType.PHOTOGRAPH)) == 1


def test_photograph_is_recognized_and_reused_by_applications(db: Session) -> None:
    photograph = asyncio.run(save_upload(db, image_upload(), DocumentType.PHOTOGRAPH))
    application = create_application(db, "DRIVING_LICENCE_001")

    _, missing_documents, _ = determine_missing_requirements(db, get_application(db, application.id))
    assert "PHOTOGRAPH" not in missing_documents

    attach_my_documents(db, application.id, [photograph.id])
    assert photograph.id in {item.document_id for item in get_application(db, application.id).documents}


def test_deleting_photograph_removes_profile_photo_and_future_reuse(db: Session) -> None:
    photograph = asyncio.run(save_upload(db, image_upload(), DocumentType.PHOTOGRAPH))
    delete_document(db, photograph.id)

    assert get_profile(db).profile_photo is None
    application = create_application(db, "DRIVING_LICENCE_001")
    _, missing_documents, _ = determine_missing_requirements(db, get_application(db, application.id))
    assert "PHOTOGRAPH" in missing_documents


def test_deleting_an_attached_reusable_document_detaches_it_first(db: Session) -> None:
    photograph = asyncio.run(save_upload(db, image_upload(), DocumentType.PHOTOGRAPH))
    signature = Document(
        user_id=photograph.user_id,
        name="Signature",
        document_type=DocumentType.SIGNATURE,
        source=DocumentSource.PROFILE_UPLOAD,
    )
    application = create_application(db, "RECRUITMENT_EXAM_001")
    db.add(signature)
    db.flush()
    db.add_all([
        ApplicationDocument(application_id=application.id, document_id=photograph.id),
        ApplicationDocument(application_id=application.id, document_id=signature.id),
    ])
    db.commit()

    delete_document(db, photograph.id)
    delete_document(db, signature.id)

    assert db.get(Document, photograph.id) is None
    assert db.get(Document, signature.id) is None
    assert db.scalar(select(func.count()).select_from(ApplicationDocument).where(ApplicationDocument.application_id == application.id)) == 0


def test_photograph_rejects_pdf_content(db: Session) -> None:
    upload = UploadFile(
        filename="photo.pdf",
        file=BytesIO(b"%PDF-1.7"),
        headers=Headers({"content-type": "application/pdf"}),
    )
    from app.services.profile_service import InvalidDocumentError

    with pytest.raises(InvalidDocumentError) as error:
        asyncio.run(save_upload(db, upload, DocumentType.PHOTOGRAPH))
    assert error.value.code == "UNSUPPORTED_PHOTOGRAPH"
