import pytest
from sqlalchemy import delete, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

from app.core.database import Base
from app.api.applications import read_application, read_applications
from app.models.application import ApplicationDocument, ApplicationStatus
from app.models.profile import Document, Profile
from app.schemas.application import AdditionalDataUpdate
from app.schemas.profile import ProfileUpdate
from app.services.application_engine import (
    ApplicationDeletionNotAllowedError,
    create_application,
    delete_draft_application,
    get_application,
    get_application_detail,
    list_applications,
    save_additional_data,
)
from app.services.consent_service import ApplicationIncompleteForConsentError, grant_consent
from app.services.digilocker_service import select_application_documents
from app.services.payment_submission_service import process_payment, submit_application
from app.services.preview_service import ApplicationNotReadyForFinalizationError, finalize_application, get_preview
from app.services.profile_service import update_profile
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'contract.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def complete_scholarship_requirements(db: Session, application_id: str) -> None:
    save_additional_data(
        db,
        application_id,
        AdditionalDataUpdate(
            answers={
                "course": "Computer Science",
                "institution": "Demo Institute",
                "academic_year": "2026-27",
            }
        ),
    )
    select_application_documents(db, application_id, ["mock-class-12", "mock-income"])


def submit_scholarship(db: Session) -> str:
    application = create_application(db, "SCHOLARSHIP_001")
    complete_scholarship_requirements(db, application.id)
    consent = grant_consent(db, application.id)
    assert consent.status == "GRANTED"
    assert get_application(db, application.id).status == ApplicationStatus.READY_FOR_REVIEW
    finalize_application(db, application.id)
    assert get_application(db, application.id).status == ApplicationStatus.READY_FOR_REVIEW
    process_payment(db, application.id)
    submit_application(db, application.id)
    return application.id


def test_consent_enforces_required_profile_and_documents_but_answers_remain_editable(db: Session) -> None:
    application = create_application(db, "SCHOLARSHIP_001")
    profile = db.scalar(select(Profile))
    assert profile is not None
    profile.full_name = ""
    db.commit()

    updated = save_additional_data(
        db,
        application.id,
        AdditionalDataUpdate(answers={"course": "First", "institution": "Demo", "academic_year": "2026-27"}),
    )
    assert updated.answers["course"] == "First"
    updated = save_additional_data(
        db,
        application.id,
        AdditionalDataUpdate(answers={"course": "Updated"}),
    )
    assert updated.answers["course"] == "Updated"

    with pytest.raises(ApplicationIncompleteForConsentError) as error:
        grant_consent(db, application.id)
    assert error.value.missing_profile_fields == ["full_name"]
    assert error.value.missing_documents == ["INCOME_CERTIFICATE", "MARKSHEET"]


def test_finalization_rechecks_required_documents(db: Session) -> None:
    application = create_application(db, "SCHOLARSHIP_001")
    complete_scholarship_requirements(db, application.id)
    grant_consent(db, application.id)

    selected = db.scalar(
        select(Document).where(Document.document_type == "INCOME_CERTIFICATE")
    )
    assert selected is not None
    db.execute(
        delete(ApplicationDocument).where(
            ApplicationDocument.application_id == application.id,
            ApplicationDocument.document_id == selected.id,
        )
    )
    selected.is_imported = False
    db.commit()

    with pytest.raises(ApplicationNotReadyForFinalizationError) as error:
        finalize_application(db, application.id)
    assert error.value.missing_documents == ["INCOME_CERTIFICATE"]


def test_finalization_rechecks_required_profile_fields(db: Session) -> None:
    application = create_application(db, "SCHOLARSHIP_001")
    complete_scholarship_requirements(db, application.id)
    grant_consent(db, application.id)
    profile = db.scalar(select(Profile))
    assert profile is not None
    profile.full_name = ""
    db.commit()

    with pytest.raises(ApplicationNotReadyForFinalizationError) as error:
        finalize_application(db, application.id)
    assert error.value.missing_profile_fields == ["full_name"]


def test_application_list_and_detail_are_backend_authoritative(db: Session) -> None:
    draft = create_application(db, "DRIVING_LICENCE_001")
    submitted_id = submit_scholarship(db)

    summaries = list_applications(db)
    by_id = {summary.id: summary for summary in summaries}
    assert by_id[draft.id].service_name == "Driving Licence Application"
    assert by_id[draft.id].requires_action is True
    assert by_id[submitted_id].status == ApplicationStatus.SUBMITTED
    assert by_id[submitted_id].reference_number is not None
    assert by_id[submitted_id].requires_action is False

    detail = get_application_detail(db, submitted_id)
    assert detail.reference_number is not None
    assert detail.consent_status == "GRANTED"
    assert detail.payment_status == "NOT_REQUIRED"
    assert detail.submission_status == "SUBMITTED"

    endpoint_summaries = read_applications(db)
    endpoint_detail = read_application(submitted_id, db)
    assert {item.id for item in endpoint_summaries} == set(by_id)
    assert endpoint_detail.reference_number == detail.reference_number


def test_submitted_preview_ignores_later_profile_and_document_changes(db: Session) -> None:
    application_id = submit_scholarship(db)
    submitted_preview = get_preview(db, application_id)
    submitted_document_name = next(
        item["name"] for item in submitted_preview.documents if item["document_type"] == "INCOME_CERTIFICATE"
    )

    update_profile(db, ProfileUpdate(full_name="Changed After Submission"))
    document = db.scalar(select(Document).where(Document.document_type == "INCOME_CERTIFICATE"))
    assert document is not None
    document.name = "Renamed After Submission"
    db.commit()

    historical_preview = get_preview(db, application_id)
    assert historical_preview.profile["full_name"] == "Rahul Kumar"
    assert next(
        item["name"] for item in historical_preview.documents if item["document_type"] == "INCOME_CERTIFICATE"
    ) == submitted_document_name



def test_unfinished_states_are_deletable_but_submitted_application_is_not(db: Session) -> None:
    draft = create_application(db, "SCHOLARSHIP_001")
    complete_scholarship_requirements(db, draft.id)
    assert get_application(db, draft.id).status == ApplicationStatus.CONSENT_REQUIRED
    delete_draft_application(db, draft.id)

    submitted_id = submit_scholarship(db)
    with pytest.raises(ApplicationDeletionNotAllowedError):
        delete_draft_application(db, submitted_id)
