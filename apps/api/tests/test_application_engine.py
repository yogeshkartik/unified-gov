import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models.application import ApplicationStatus
from app.models.profile import Document, DocumentSource, DocumentType
from app.schemas.application import AdditionalDataUpdate
from app.services.application_engine import (
    ApplicationDeletionNotAllowedError,
    ApplicationNotFoundError,
    InvalidApplicationFieldsError,
    create_application,
    delete_draft_application,
    determine_missing_requirements,
    get_application,
    save_additional_data,
)
from app.services.application_document_service import attach_my_documents
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'applications.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_application_creation_enters_additional_information_state(db: Session) -> None:
    response = create_application(db, "SCHOLARSHIP_001")

    assert response.status == "ADDITIONAL_INFO_REQUIRED"
    assert response.service_id == "SCHOLARSHIP_001"
    assert get_application(db, response.id).service_id == "SCHOLARSHIP_001"


def test_draft_application_can_be_deleted(db: Session) -> None:
    response = create_application(db, "SCHOLARSHIP_001")

    delete_draft_application(db, response.id)

    with pytest.raises(ApplicationNotFoundError):
        get_application(db, response.id)


def test_only_drafts_can_be_deleted(db: Session) -> None:
    response = create_application(db, "SCHOLARSHIP_001")
    application = get_application(db, response.id)
    application.status = ApplicationStatus.SUBMITTED
    db.commit()

    with pytest.raises(ApplicationDeletionNotAllowedError):
        delete_draft_application(db, response.id)


def test_application_creation_reports_missing_service_fields_and_documents(db: Session) -> None:
    response = create_application(db, "SCHOLARSHIP_001")

    assert response.missing_profile_fields == []
    assert response.missing_documents == ["INCOME_CERTIFICATE", "MARKSHEET"]
    assert response.missing_fields == ["course", "institution", "academic_year"]


def test_additional_data_rejects_fields_not_in_the_service_schema(db: Session) -> None:
    response = create_application(db, "SCHOLARSHIP_001")

    with pytest.raises(InvalidApplicationFieldsError) as error:
        save_additional_data(db, response.id, AdditionalDataUpdate(answers={"unrelated_field": "value"}))

    assert error.value.fields == {"unrelated_field": "This field is not defined for the selected service."}


def test_completed_additional_data_clears_missing_fields(db: Session) -> None:
    response = create_application(db, "SCHOLARSHIP_001")

    updated = save_additional_data(
        db,
        response.id,
        AdditionalDataUpdate(
            answers={
                "course": "Computer Science",
                "institution": "Demo Institute",
                "academic_year": "2026-27",
            }
        ),
    )

    assert updated.missing_fields == []
    assert updated.status == "CONSENT_REQUIRED"
    assert updated.answers == {
        "course": "Computer Science",
        "institution": "Demo Institute",
        "academic_year": "2026-27",
    }


def test_reusable_uploads_match_by_document_type_and_are_attached_explicitly(db: Session) -> None:
    application = create_application(db, "RECRUITMENT_EXAM_001")
    signature = Document(
        user_id=get_application(db, application.id).user_id,
        name="Signature",
        document_type=DocumentType.SIGNATURE,
        source=DocumentSource.PROFILE_UPLOAD,
        storage_key="signature.png",
    )
    db.add(signature)
    db.commit()

    assert "SIGNATURE" in application.missing_documents
    attach_my_documents(db, application.id, [signature.id])
    _, missing_documents, _ = determine_missing_requirements(db, get_application(db, application.id))
    assert "SIGNATURE" not in missing_documents
