from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.chat import get_application_review as review_action
from app.api.chat import grant_chat_consent
from app.core.database import Base
from app.models.application import (
    Application,
    ApplicationDocument,
    ApplicationSnapshot,
    ApplicationStatus,
)
from app.models.consent import Consent
from app.models.profile import Document, DocumentSource, Profile, User
from app.models.service import ServiceFieldType
from app.schemas.application_review import (
    ApplicationReviewRequest,
    GrantChatConsentRequest,
)
from app.schemas.chat import ChatRequest
from app.services import application_engine, application_review_service
from app.services.chat_service import TOOLS, chat
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    from app.core.config import settings

    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'chat-review.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def complete_application(db: Session, service_id: str) -> Application:
    created = application_engine.create_application(db, service_id)
    application = application_engine.get_application(db, created.id)
    for field in application.service.fields:
        if not field.required:
            continue
        if field.field_type == ServiceFieldType.CHECKBOX:
            value = False
        elif field.options:
            value = field.options[0]
        elif field.field_type == ServiceFieldType.NUMBER:
            value = 2
        elif field.field_type == ServiceFieldType.DATE:
            value = "2026-01-01"
        else:
            value = f"Saved {field.label}"
        application_engine.set_application_field(db, application.id, field.key, value)
    application = application_engine.get_application(db, application.id)
    for requirement in application.service.document_requirements:
        if not requirement.required:
            continue
        available = [item.document for item in application.documents]
        available.extend(
            document
            for document in application.user.documents
            if document.source == DocumentSource.PROFILE_UPLOAD
            and document.document_type in {"PHOTOGRAPH", "PROFILE_PHOTO"}
        )
        if any(
            application_engine.document_type_matches(
                requirement.document_type, document.document_type
            )
            for document in available
            if document is not None
        ):
            continue
        document = Document(
            user_id=application.user_id,
            name=f"{requirement.label}.pdf",
            display_name=f"{requirement.label}.pdf",
            document_type=requirement.document_type,
            source=DocumentSource.PROFILE_UPLOAD,
            storage_key=f"tests/{requirement.document_type}.pdf",
        )
        db.add(document)
        db.flush()
        db.add(
            ApplicationDocument(
                application_id=application.id, document_id=document.id
            )
        )
    db.commit()
    return application_engine.get_application(db, application.id)


def test_review_is_owner_scoped_live_and_read_only(db: Session) -> None:
    application = complete_application(db, "DRIVING_LICENCE_001")
    before = (application.status, application.updated_at)

    result = review_action(ApplicationReviewRequest(application_id=application.id), db)

    assert result.review.service.id == "DRIVING_LICENCE_001"
    assert {item.key for item in result.review.applicant_information} == {
        "full_name",
        "date_of_birth",
        "address",
    }
    assert {item.key for item in result.review.application_details} == {
        "licence_type",
        "vehicle_class",
    }
    assert {item.document_type for item in result.review.documents} == {
        "PHOTOGRAPH",
        "IDENTITY_DOCUMENT",
    }
    assert all(not hasattr(item, "document_id") for item in result.review.documents)
    assert result.review.payment.amount == 200
    assert result.review.payment.status == "PENDING"
    assert result.review.consent.status == "PENDING"
    assert result.consent_card is not None
    loaded = db.get(Application, application.id)
    assert (loaded.status, loaded.updated_at) == before
    assert db.scalar(select(func.count()).select_from(Consent)) == 0
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 0


def test_review_formats_false_as_a_completed_typed_value_and_select_is_canonical(
    db: Session,
) -> None:
    free = complete_application(db, "PM_KISAN_001")
    boolean = application_review_service.get_application_review(db, free.id).review.application_details[0]
    assert boolean.field_type == "checkbox"
    assert boolean.value is False

    paid = complete_application(db, "DRIVING_LICENCE_001")
    selected = application_review_service.get_application_review(db, paid.id).review.application_details[0]
    assert selected.value == "Learner's Licence"
    assert selected.value in selected.options


@pytest.mark.parametrize(
    ("service_id", "required", "amount"),
    [("PM_KISAN_001", False, 0), ("DRIVING_LICENCE_001", True, 200)],
)
def test_review_reports_free_and_paid_services(
    db: Session, service_id: str, required: bool, amount: float
) -> None:
    review = application_review_service.get_application_review(
        db, complete_application(db, service_id).id
    ).review
    assert review.payment.required is required
    assert review.payment.amount == amount
    assert review.payment.status == ("PENDING" if required else "NOT_REQUIRED")


def test_review_rejects_foreign_missing_and_terminal_applications(db: Session) -> None:
    other = User(email="phase5-foreign@example.test", auth_state="DEMO")
    db.add(other)
    db.flush()
    foreign = Application(
        user_id=other.id,
        service_id="PM_KISAN_001",
        status=ApplicationStatus.CONSENT_REQUIRED,
    )
    db.add(foreign)
    db.commit()
    for application_id in [foreign.id, "not-an-application"]:
        with pytest.raises(HTTPException) as error:
            review_action(ApplicationReviewRequest(application_id=application_id), db)
        assert error.value.status_code == 404

    terminal = complete_application(db, "PM_KISAN_001")
    terminal.status = ApplicationStatus.CANCELLED
    db.commit()
    with pytest.raises(HTTPException) as terminal_error:
        review_action(ApplicationReviewRequest(application_id=terminal.id), db)
    assert terminal_error.value.detail["code"] == "APPLICATION_REVIEW_UNAVAILABLE"


def test_each_incomplete_requirement_blocks_review(db: Session) -> None:
    missing_field = application_engine.create_application(db, "PM_KISAN_001")
    with pytest.raises(application_review_service.ApplicationNotReadyForReviewError) as field_error:
        application_review_service.get_application_review(db, missing_field.id)
    assert field_error.value.missing_fields == ["farmer_declaration"]

    missing_document = application_engine.create_application(db, "DRIVING_LICENCE_001")
    application_engine.set_application_field(db, missing_document.id, "licence_type", "Learner's Licence")
    application_engine.set_application_field(db, missing_document.id, "vehicle_class", "MCWG — Motorcycle with gear")
    with pytest.raises(application_review_service.ApplicationNotReadyForReviewError) as document_error:
        application_review_service.get_application_review(db, missing_document.id)
    assert "IDENTITY_DOCUMENT" in document_error.value.missing_documents

    complete = complete_application(db, "SCHOLARSHIP_001")
    profile = db.scalar(select(Profile))
    profile.full_name = ""
    db.commit()
    with pytest.raises(application_review_service.ApplicationNotReadyForReviewError) as profile_error:
        application_review_service.get_application_review(db, complete.id)
    assert profile_error.value.missing_profile_fields == ["full_name"]


@pytest.mark.parametrize(
    ("service_id", "next_stage", "payment_required", "submission_ready"),
    [
        ("DRIVING_LICENCE_001", "PAYMENT", True, False),
        ("PM_KISAN_001", "SUBMISSION", False, True),
    ],
)
def test_explicit_chat_consent_persists_and_advances_without_submission(
    db: Session,
    service_id: str,
    next_stage: str,
    payment_required: bool,
    submission_ready: bool,
) -> None:
    application = complete_application(db, service_id)
    result = grant_chat_consent(
        GrantChatConsentRequest(
            application_id=application.id, consent_confirmed=True
        ),
        db,
    )
    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    loaded = db.get(Application, application.id)
    assert consent is not None and consent.granted_at is not None
    assert result.review.consent.granted is True
    assert result.progress.consent.granted is True
    assert result.progress.next_stage == next_stage
    assert result.progress.payment.required is payment_required
    assert result.progress.ready_for_submission is submission_ready
    assert loaded.status == ApplicationStatus.READY_FOR_REVIEW
    assert loaded.government_reference_number is None
    assert loaded.submitted_at is None
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 0


def test_repeated_consent_is_idempotent_and_resume_reads_shared_state(db: Session) -> None:
    application = complete_application(db, "PM_KISAN_001")
    payload = GrantChatConsentRequest(application_id=application.id, consent_confirmed=True)
    first = grant_chat_consent(payload, db)
    granted_at = db.scalar(select(Consent.granted_at).where(Consent.application_id == application.id))
    second = grant_chat_consent(payload, db)
    assert first.progress.consent.granted and second.progress.consent.granted
    assert db.scalar(select(func.count()).select_from(Consent)) == 1
    assert db.scalar(select(Consent.granted_at).where(Consent.application_id == application.id)) == granted_at
    resumed = application_engine.create_or_resume_application(db, "PM_KISAN_001")[1]
    assert resumed.id == application.id
    review = application_review_service.get_application_review(db, resumed.id)
    assert review.review.consent.granted is True
    assert review.consent_card is None


def test_stale_review_cannot_bypass_document_revalidation(db: Session) -> None:
    application = complete_application(db, "DRIVING_LICENCE_001")
    application_review_service.get_application_review(db, application.id)
    identity = next(
        item
        for item in application.documents
        if item.document.document_type == "IDENTITY_DOCUMENT"
    )
    db.delete(identity)
    db.commit()
    with pytest.raises(HTTPException) as error:
        grant_chat_consent(
            GrantChatConsentRequest(
                application_id=application.id, consent_confirmed=True
            ),
            db,
        )
    assert error.value.detail["code"] == "APPLICATION_INCOMPLETE"
    assert error.value.detail["missing_documents"] == ["IDENTITY_DOCUMENT"]
    assert db.scalar(select(func.count()).select_from(Consent)) == 0


def test_missing_profile_and_field_each_reject_consent(db: Session) -> None:
    missing_field = application_engine.create_application(db, "PM_KISAN_001")
    with pytest.raises(HTTPException) as field_error:
        grant_chat_consent(
            GrantChatConsentRequest(
                application_id=missing_field.id, consent_confirmed=True
            ),
            db,
        )
    assert field_error.value.detail["missing_fields"] == ["farmer_declaration"]

    missing_profile = complete_application(db, "SCHOLARSHIP_001")
    profile = db.scalar(select(Profile))
    profile.full_name = ""
    db.commit()
    with pytest.raises(HTTPException) as profile_error:
        grant_chat_consent(
            GrantChatConsentRequest(
                application_id=missing_profile.id, consent_confirmed=True
            ),
            db,
        )
    assert profile_error.value.detail["missing_profile_fields"] == ["full_name"]


def test_foreign_nonexistent_invalid_stage_and_terminal_consent_are_rejected(
    db: Session,
) -> None:
    other = User(email="phase5-consent-foreign@example.test", auth_state="DEMO")
    db.add(other)
    db.flush()
    foreign = Application(
        user_id=other.id,
        service_id="PM_KISAN_001",
        status=ApplicationStatus.CONSENT_REQUIRED,
    )
    db.add(foreign)
    db.commit()
    for application_id in [foreign.id, "missing"]:
        with pytest.raises(HTTPException) as error:
            grant_chat_consent(
                GrantChatConsentRequest(
                    application_id=application_id, consent_confirmed=True
                ),
                db,
            )
        assert error.value.status_code == 404

    invalid = complete_application(db, "PM_KISAN_001")
    invalid.status = ApplicationStatus.READY_FOR_REVIEW
    db.commit()
    with pytest.raises(HTTPException) as invalid_error:
        grant_chat_consent(
            GrantChatConsentRequest(
                application_id=invalid.id, consent_confirmed=True
            ),
            db,
        )
    assert invalid_error.value.detail["code"] == "APPLICATION_NOT_ELIGIBLE_FOR_CONSENT"

    invalid.status = ApplicationStatus.SUBMITTED
    db.commit()
    with pytest.raises(HTTPException) as terminal_error:
        grant_chat_consent(
            GrantChatConsentRequest(
                application_id=invalid.id, consent_confirmed=True
            ),
            db,
        )
    assert terminal_error.value.detail["code"] == "APPLICATION_NOT_ELIGIBLE_FOR_CONSENT"


def test_ordinary_yes_message_has_no_consent_mutation(db: Session) -> None:
    application = complete_application(db, "PM_KISAN_001")

    class PlainProvider:
        def respond(self, items):
            return SimpleNamespace(output=[], output_text="Please use the consent control.")

    response = chat(
        db,
        ChatRequest(message="yes", active_application_id=application.id),
        PlainProvider(),
    )
    assert response.message == "Please use the consent control."
    assert db.scalar(select(func.count()).select_from(Consent)) == 0
    assert not any(tool["name"] == "grant_consent" for tool in TOOLS)


def test_review_tool_returns_cards_directly_but_minimizes_model_output(db: Session) -> None:
    application = complete_application(db, "PM_KISAN_001")

    class ReviewProvider:
        def __init__(self):
            self.step = 0
            self.tool_output = None

        def respond(self, items):
            self.step += 1
            if self.step == 1:
                return SimpleNamespace(
                    output=[SimpleNamespace(type="function_call", name="get_application_review", arguments=f'{{"application_id":"{application.id}"}}', call_id="review")],
                    output_text="",
                )
            self.tool_output = next(item["output"] for item in items if isinstance(item, dict) and item.get("call_id") == "review")
            return SimpleNamespace(output=[], output_text="Please review the card.")

    provider = ReviewProvider()
    response = chat(db, ChatRequest(message="Review my application"), provider)
    assert "Rahul Kumar" not in provider.tool_output
    assert any(component.type == "REVIEW_CARD" for component in response.components)
    assert any(component.type == "CONSENT_CARD" for component in response.components)
