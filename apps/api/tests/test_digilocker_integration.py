from pathlib import Path
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.digilocker import download_digilocker_document
from app.api.documents import get_document_file
from app.core.config import settings
from app.core.database import Base
from app.integrations.digilocker.mock import MockDigiLockerProvider, ProviderDocumentNotFoundError
from app.models.application import Application, ApplicationStatus
from app.models.profile import Document, DocumentSource
from app.schemas.application import AdditionalDataUpdate
from app.services.application_engine import create_application, determine_missing_requirements, get_application, save_additional_data
from app.services.consent_service import grant_consent
from app.services.digilocker_service import select_application_documents
from app.services.payment_submission_service import process_payment, submit_application
from app.services.preview_service import finalize_application, get_preview
from app.services.profile_service import DocumentNotFoundError, delete_document, list_documents
from app.services.seed import SEED_FILES_DIR, SEED_GENERIC_DOCUMENT_FILENAME, seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'digilocker.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_generic_seed_pdf_exists() -> None:
    seed_pdf = SEED_FILES_DIR / SEED_GENERIC_DOCUMENT_FILENAME
    assert seed_pdf.is_file()
    assert seed_pdf.stat().st_size > 0


def test_mock_provider_exposes_distinct_logical_metadata() -> None:
    provider = MockDigiLockerProvider()
    docs = provider.get_documents("user-1")

    assert len(docs) == 6
    types = {doc.document_type for doc in docs}
    assert "10TH_MARKSHEET" in types
    assert "12TH_MARKSHEET" in types
    assert "INCOME_CERTIFICATE" in types
    assert "CASTE_CERTIFICATE" in types
    assert "DRIVING_LICENCE" in types
    assert "DEGREE_CERTIFICATE" in types

    doc_marksheet = provider.get_document("mock-class-12")
    doc_income = provider.get_document("mock-income")
    assert doc_marksheet.name == "Class 12 Marksheet"
    assert doc_income.name == "Income Certificate"
    assert doc_marksheet.id != doc_income.id


def test_mock_provider_rejects_unknown_documents() -> None:
    with pytest.raises(ProviderDocumentNotFoundError):
        MockDigiLockerProvider().get_document("not-a-real-document")


def test_digilocker_document_download_endpoint() -> None:
    response = download_digilocker_document("mock-income")
    assert response.media_type == "application/pdf"
    assert response.filename == "income-certificate-demo.pdf"
    assert Path(response.path).is_file()
    assert Path(response.path).name == "demo-government-document.pdf"


def test_digilocker_documents_not_in_my_documents_before_submission(db: Session) -> None:
    my_docs = list_documents(db)
    my_doc_types = {d.document_type for d in my_docs}
    assert "INCOME_CERTIFICATE" not in my_doc_types

    application = create_application(db, "SCHOLARSHIP_001")
    select_application_documents(db, application.id, ["mock-income"])

    # Before submission, it should still NOT be in My Documents
    my_docs_after_selection = list_documents(db)
    assert "INCOME_CERTIFICATE" not in {d.document_type for d in my_docs_after_selection}


def test_successful_application_submission_keeps_digilocker_document_external(
    db: Session,
) -> None:
    # 1. Start application
    application = create_application(db, "SCHOLARSHIP_001")
    save_additional_data(
        db,
        application.id,
        AdditionalDataUpdate(
            answers={
                "course": "Computer Science",
                "institution": "Demo Institute",
                "academic_year": "2026-27",
            }
        ),
    )
    select_application_documents(db, application.id, ["mock-class-12", "mock-income"])
    grant_consent(db, application.id)
    snapshot = finalize_application(db, application.id)

    # 2. Process payment (free service) and submit
    process_payment(db, application.id)
    submit_response = submit_application(db, application.id)
    assert submit_response.status == ApplicationStatus.SUBMITTED

    # 3. Provider documents remain application-scoped after submission.
    my_docs = list_documents(db)
    income_docs = [d for d in my_docs if d.document_type == "INCOME_CERTIFICATE"]
    assert income_docs == []
    income_doc = db.scalar(
        select(Document).where(
            Document.document_type == "INCOME_CERTIFICATE",
            Document.source == DocumentSource.DIGILOCKER,
        )
    )
    assert income_doc is not None
    assert income_doc.is_imported is False

    # 4. Provider documents cannot be accessed or deleted through personal-document APIs.
    with pytest.raises(HTTPException) as error:
        get_document_file(income_doc.id, db)
    assert error.value.status_code == 404
    with pytest.raises(DocumentNotFoundError):
        delete_document(db, income_doc.id)

    # 5. Verify snapshot remains immutable
    assert snapshot.snapshot_json["application_id"] == application.id

    # 6. A subsequent application can explicitly select the same provider document again.
    app2 = create_application(db, "SCHOLARSHIP_001")
    assert "INCOME_CERTIFICATE" in app2.missing_documents
    select_application_documents(db, app2.id, ["mock-income"])
    assert "INCOME_CERTIFICATE" not in determine_missing_requirements(db, get_application(db, app2.id))[1]


def test_repeated_provider_selection_does_not_create_personal_document_entries(db: Session) -> None:
    # First application
    app1 = create_application(db, "SCHOLARSHIP_001")
    save_additional_data(
        db,
        app1.id,
        AdditionalDataUpdate(
            answers={
                "course": "Computer Science",
                "institution": "Demo Institute",
                "academic_year": "2026-27",
            }
        ),
    )
    select_application_documents(db, app1.id, ["mock-class-12", "mock-income"])
    grant_consent(db, app1.id)
    finalize_application(db, app1.id)
    process_payment(db, app1.id)
    submit_application(db, app1.id)

    # Second application also selecting mock-income
    app2 = create_application(db, "SCHOLARSHIP_001")
    save_additional_data(
        db,
        app2.id,
        AdditionalDataUpdate(
            answers={
                "course": "Information Technology",
                "institution": "Demo Institute",
                "academic_year": "2026-27",
            }
        ),
    )
    select_application_documents(db, app2.id, ["mock-class-12", "mock-income"])
    grant_consent(db, app2.id)
    finalize_application(db, app2.id)
    process_payment(db, app2.id)
    submit_application(db, app2.id)

    assert [d for d in list_documents(db) if d.document_type == "INCOME_CERTIFICATE"] == []
    provider_income_docs = list(
        db.scalars(
            select(Document).where(
                Document.document_type == "INCOME_CERTIFICATE",
                Document.source == DocumentSource.DIGILOCKER,
            )
        )
    )
    assert len(provider_income_docs) == 1
