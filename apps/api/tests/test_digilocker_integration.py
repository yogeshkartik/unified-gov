import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.integrations.digilocker.mock import MockDigiLockerProvider, ProviderDocumentNotFoundError
from app.models.profile import DocumentSource
from app.services.application_engine import create_application
from app.services.digilocker_service import select_application_documents
from app.services.preview_service import get_preview
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path) -> Session:
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


def test_mock_provider_exposes_only_synthetic_documents_and_grants_mock_consent() -> None:
    provider = MockDigiLockerProvider()

    documents = provider.get_documents("synthetic-user")
    consent = provider.request_consent("synthetic-user", ["mock-class-12", "mock-income"])

    assert len(documents) == 6
    assert documents[0].name == "Class 10 Marksheet"
    assert provider.get_document("mock-degree").document_type == "DEGREE_CERTIFICATE"
    assert consent.status == "GRANTED"
    assert consent.document_ids == ["mock-class-12", "mock-income"]


def test_mock_provider_rejects_unknown_documents() -> None:
    with pytest.raises(ProviderDocumentNotFoundError):
        MockDigiLockerProvider().get_document("not-a-real-document")


def test_selecting_mock_document_attaches_it_to_application_preview(db: Session) -> None:
    application = create_application(db, "SCHOLARSHIP_001")

    selected = select_application_documents(db, application.id, ["mock-income"])
    preview = get_preview(db, application.id)

    assert selected[0].source == DocumentSource.DIGILOCKER
    assert selected[0].document_type == "INCOME_CERTIFICATE"
    assert preview.documents == [
        {
            "id": selected[0].id,
            "name": "Income Certificate",
            "document_type": "INCOME_CERTIFICATE",
            "source": "DIGILOCKER",
        }
    ]
