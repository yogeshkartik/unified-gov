from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine, delete, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.chat import get_next_transaction, pay_application, submit_chat_application
from app.core.database import Base
from app.integrations.payment.mock import MockPaymentProvider
from app.models.application import (
    Application,
    ApplicationAnswer,
    ApplicationDocument,
    ApplicationSnapshot,
    ApplicationStatus,
)
from app.models.consent import Consent
from app.models.payment import Payment, PaymentStatus
from app.models.profile import Document, DocumentSource, Profile, User
from app.models.service import ServiceFieldType
from app.schemas.chat import ChatRequest
from app.schemas.chat_transaction import SubmitApplicationRequest, TransactionRequest
from app.services import (
    application_document_service,
    application_engine,
    application_progress,
    chat_transaction_service,
    consent_service,
    payment_submission_service,
)
from app.services.chat_service import TOOLS, chat
from app.services.preview_service import get_preview
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    from app.core.config import settings

    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'chat-transactions.db'}")
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
            value = True
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
            document is not None
            and application_engine.document_type_matches(
                requirement.document_type, document.document_type
            )
            for document in available
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
    consent_service.grant_consent(db, application.id)
    return application_engine.get_application(db, application.id)


def pay_payload(application_id: str) -> TransactionRequest:
    return TransactionRequest(application_id=application_id)


def submit_payload(application_id: str) -> SubmitApplicationRequest:
    return SubmitApplicationRequest(
        application_id=application_id,
        submission_confirmed=True,
    )


def assert_error_code(call, code: str) -> None:
    with pytest.raises(HTTPException) as error:
        call()
    assert error.value.status_code in {404, 409}
    assert error.value.detail["code"] == code


def test_paid_chat_payment_is_authoritative_persisted_and_idempotent(
    db: Session,
) -> None:
    application = complete_application(db, "DRIVING_LICENCE_001")
    assert get_next_transaction(pay_payload(application.id), db).payment_card.amount == 200

    with pytest.raises(ValidationError):
        TransactionRequest(application_id=application.id, amount=1)
    with pytest.raises(ValidationError):
        SubmitApplicationRequest(
            application_id=application.id, submission_confirmed=False
        )

    first = pay_application(pay_payload(application.id), db)
    persisted = db.scalar(select(Payment).where(Payment.application_id == application.id))
    assert persisted is not None
    assert persisted.amount == 200
    assert persisted.currency == "INR"
    assert persisted.status == PaymentStatus.SUCCESS
    assert persisted.transaction_id.startswith("TXN-")
    assert persisted.completed_at is not None
    assert first.payment_card.demo is True
    assert first.payment_card.amount == 200
    assert first.payment_card.transaction_reference == persisted.transaction_id
    assert first.progress.next_stage == "SUBMISSION"
    assert first.progress.payment.status == "COMPLETED"
    assert first.submission_confirmation is not None
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 0
    loaded = db.get(Application, application.id)
    assert loaded.status == ApplicationStatus.READY_FOR_REVIEW
    assert loaded.government_reference_number is None
    assert loaded.submitted_at is None

    second = pay_application(pay_payload(application.id), db)
    assert second.payment.transaction_id == first.payment.transaction_id
    assert db.scalar(select(func.count()).select_from(Payment)) == 1


def test_failed_demo_payment_stays_retryable_and_creates_no_submission_state(
    db: Session,
) -> None:
    application = complete_application(db, "DRIVING_LICENCE_001")
    failed = payment_submission_service.process_payment(
        db, application.id, provider=MockPaymentProvider(force_failure=True)
    )
    components = chat_transaction_service.get_transaction_components(db, application.id)

    assert failed.status == PaymentStatus.FAILED
    assert application_progress.get_application_progress(db, application.id).next_stage == "PAYMENT"
    assert components.payment_card is not None
    assert components.payment_card.payment_status == "FAILED"
    assert db.get(Application, application.id).status == ApplicationStatus.PAYMENT_REQUIRED
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 0
    assert db.get(Application, application.id).government_reference_number is None


def test_payment_rejects_foreign_missing_free_preconsent_invalid_and_terminal(
    db: Session,
) -> None:
    other = User(email="phase6-foreign@example.test", auth_state="DEMO")
    db.add(other)
    db.flush()
    foreign = Application(
        user_id=other.id,
        service_id="DRIVING_LICENCE_001",
        status=ApplicationStatus.READY_FOR_REVIEW,
    )
    db.add(foreign)
    db.commit()
    assert_error_code(
        lambda: pay_application(pay_payload(foreign.id), db), "APPLICATION_NOT_FOUND"
    )
    assert_error_code(
        lambda: pay_application(pay_payload("missing"), db), "APPLICATION_NOT_FOUND"
    )

    free = complete_application(db, "PM_KISAN_001")
    assert_error_code(
        lambda: pay_application(pay_payload(free.id), db), "PAYMENT_NOT_REQUIRED"
    )
    assert db.scalar(select(Payment).where(Payment.application_id == free.id)) is None

    preconsent = complete_application(db, "DRIVING_LICENCE_001")
    db.execute(delete(Consent).where(Consent.application_id == preconsent.id))
    db.commit()
    assert_error_code(
        lambda: pay_application(pay_payload(preconsent.id), db), "CONSENT_REQUIRED"
    )

    invalid = complete_application(db, "DRIVING_LICENCE_001")
    invalid.status = ApplicationStatus.DRAFT
    db.commit()
    assert_error_code(
        lambda: pay_application(pay_payload(invalid.id), db),
        "INVALID_APPLICATION_STAGE",
    )

    terminal = complete_application(db, "DRIVING_LICENCE_001")
    terminal.status = ApplicationStatus.CANCELLED
    db.commit()
    assert_error_code(
        lambda: pay_application(pay_payload(terminal.id), db), "APPLICATION_TERMINAL"
    )


@pytest.mark.parametrize("service_id", ["PM_KISAN_001", "DRIVING_LICENCE_001"])
def test_free_and_paid_chat_flows_finalize_once_with_canonical_success(
    db: Session, service_id: str
) -> None:
    application = complete_application(db, service_id)
    before = get_next_transaction(pay_payload(application.id), db)
    if service_id == "PM_KISAN_001":
        assert before.payment_card is None
        assert before.submission_confirmation is not None
        assert db.scalar(select(Payment).where(Payment.application_id == application.id)) is None
    else:
        assert before.payment_card is not None
        assert before.submission_confirmation is None
        paid = pay_application(pay_payload(application.id), db)
        assert paid.submission_confirmation is not None

    first = submit_chat_application(submit_payload(application.id), db)
    snapshot = db.scalar(
        select(ApplicationSnapshot).where(
            ApplicationSnapshot.application_id == application.id
        )
    )
    loaded = db.get(Application, application.id)
    assert snapshot is not None
    assert snapshot.snapshot_json["status"] == "SUBMITTED"
    assert snapshot.snapshot_json["answers"] == application.answers_by_key
    assert snapshot.snapshot_json["service"]["id"] == service_id
    assert loaded.status == ApplicationStatus.SUBMITTED
    assert loaded.government_reference_number == first.success.reference_number
    assert loaded.submitted_at == first.success.submitted_at.replace(tzinfo=None)
    assert first.success.reference_number.startswith("GOV-")
    assert first.success.status == "SUBMITTED"
    assert first.progress.next_stage == "COMPLETE"
    assert first.progress.submission_status == "SUBMITTED"

    second = submit_chat_application(submit_payload(application.id), db)
    assert second.success.reference_number == first.success.reference_number
    assert second.success.submitted_at == first.success.submitted_at
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 1
    assert get_next_transaction(pay_payload(application.id), db).submission_success.reference_number == first.success.reference_number


def test_paid_submission_requires_canonical_successful_payment(db: Session) -> None:
    application = complete_application(db, "DRIVING_LICENCE_001")
    assert_error_code(
        lambda: submit_chat_application(submit_payload(application.id), db),
        "SUCCESSFUL_PAYMENT_REQUIRED",
    )
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 0


@pytest.mark.parametrize("missing", ["profile", "answer", "document", "consent"])
def test_submission_revalidates_every_prerequisite_and_leaves_no_partial_state(
    db: Session, missing: str
) -> None:
    application = complete_application(db, "PM_KISAN_001")
    assert get_next_transaction(pay_payload(application.id), db).submission_confirmation is not None
    if missing == "profile":
        profile = db.scalar(select(Profile))
        profile.full_name = ""
    elif missing == "answer":
        db.execute(
            delete(ApplicationAnswer).where(
                ApplicationAnswer.application_id == application.id
            )
        )
    elif missing == "document":
        db.execute(
            delete(ApplicationDocument).where(
                ApplicationDocument.application_id == application.id
            )
        )
    else:
        db.execute(delete(Consent).where(Consent.application_id == application.id))
    db.commit()

    expected = "CONSENT_REQUIRED" if missing == "consent" else "APPLICATION_INCOMPLETE"
    assert_error_code(
        lambda: submit_chat_application(submit_payload(application.id), db), expected
    )
    loaded = db.get(Application, application.id)
    assert loaded.status == ApplicationStatus.READY_FOR_REVIEW
    assert loaded.government_reference_number is None
    assert loaded.submitted_at is None
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 0


def test_submission_rejects_foreign_missing_invalid_and_non_submitted_terminal(
    db: Session,
) -> None:
    other = User(email="phase6-submit-foreign@example.test", auth_state="DEMO")
    db.add(other)
    db.flush()
    foreign = Application(
        user_id=other.id,
        service_id="PM_KISAN_001",
        status=ApplicationStatus.READY_FOR_REVIEW,
    )
    db.add(foreign)
    db.commit()
    assert_error_code(
        lambda: submit_chat_application(submit_payload(foreign.id), db),
        "APPLICATION_NOT_FOUND",
    )
    assert_error_code(
        lambda: submit_chat_application(submit_payload("missing"), db),
        "APPLICATION_NOT_FOUND",
    )

    invalid = complete_application(db, "PM_KISAN_001")
    invalid.status = ApplicationStatus.PAYMENT_REQUIRED
    db.commit()
    assert_error_code(
        lambda: submit_chat_application(submit_payload(invalid.id), db),
        "INVALID_APPLICATION_STAGE",
    )

    terminal = complete_application(db, "PM_KISAN_001")
    terminal.status = ApplicationStatus.REJECTED
    db.commit()
    assert_error_code(
        lambda: submit_chat_application(submit_payload(terminal.id), db),
        "APPLICATION_TERMINAL",
    )


def test_submitted_application_is_shared_with_my_applications_and_immutable(
    db: Session,
) -> None:
    application = complete_application(db, "DRIVING_LICENCE_001")
    pay_application(pay_payload(application.id), db)
    result = submit_chat_application(submit_payload(application.id), db)
    preview_before = get_preview(db, application.id).model_dump(mode="json")

    summaries = {item.id: item for item in application_engine.list_applications(db)}
    detail = application_engine.get_application_detail(db, application.id)
    assert summaries[application.id].reference_number == result.success.reference_number
    assert summaries[application.id].status == ApplicationStatus.SUBMITTED
    assert summaries[application.id].requires_action is False
    assert detail.payment_status == "COMPLETED"
    assert detail.consent_status == "GRANTED"
    assert detail.submission_status == "SUBMITTED"

    field = application.service.fields[0]
    with pytest.raises(application_engine.ApplicationNotEditableError):
        application_engine.set_application_field(db, application.id, field.key, "changed")
    requirement = application.service.document_requirements[0]
    document = application.documents[0].document
    with pytest.raises(application_engine.ApplicationNotEditableError):
        application_document_service.attach_document(
            db, application.id, requirement.id, document.id, require_current=False
        )
    with pytest.raises(consent_service.ApplicationNotEligibleForConsentError):
        consent_service.grant_consent(db, application.id)
    with pytest.raises(payment_submission_service.TerminalApplicationTransactionError):
        payment_submission_service.process_payment(db, application.id)
    assert get_preview(db, application.id).model_dump(mode="json") == preview_before


def test_reference_numbers_are_server_generated_and_unique(db: Session) -> None:
    first = complete_application(db, "PM_KISAN_001")
    first_result = submit_chat_application(submit_payload(first.id), db)
    second = complete_application(db, "PM_KISAN_001")
    second_result = submit_chat_application(submit_payload(second.id), db)
    assert first_result.success.reference_number != second_result.success.reference_number
    assert db.scalar(select(func.count(func.distinct(Application.government_reference_number)))) == 2


def test_ordinary_chat_can_surface_cards_but_never_executes_transactions(
    db: Session,
) -> None:
    application = complete_application(db, "DRIVING_LICENCE_001")

    class ProgressProvider:
        def __init__(self, message: str):
            self.step = 0
            self.message = message

        def respond(self, items):
            self.step += 1
            if self.step == 1:
                return SimpleNamespace(
                    output=[
                        SimpleNamespace(
                            type="function_call",
                            name="get_application_progress",
                            arguments=f'{{"application_id":"{application.id}"}}',
                            call_id="progress",
                        )
                    ],
                    output_text="",
                )
            return SimpleNamespace(output=[], output_text=self.message)

    payment_response = chat(
        db,
        ChatRequest(message="Pay it", active_application_id=application.id),
        ProgressProvider("Use the demo payment control."),
    )
    assert any(component.type == "PAYMENT_CARD" for component in payment_response.components)
    assert db.scalar(select(func.count()).select_from(Payment)) == 0

    pay_application(pay_payload(application.id), db)
    submission_response = chat(
        db,
        ChatRequest(message="Yes, submit it", active_application_id=application.id),
        ProgressProvider("Use the submission confirmation control."),
    )
    assert any(
        component.type == "SUBMISSION_CONFIRMATION"
        for component in submission_response.components
    )
    assert db.scalar(select(func.count()).select_from(ApplicationSnapshot)) == 0
    assert db.get(Application, application.id).status != ApplicationStatus.SUBMITTED
    assert not any(
        tool["name"] in {"process_payment", "submit_application"} for tool in TOOLS
    )


def test_submitted_application_is_not_resumed_as_editable(db: Session) -> None:
    application = complete_application(db, "PM_KISAN_001")
    submitted = submit_chat_application(submit_payload(application.id), db)
    result, next_application = application_engine.create_or_resume_application(
        db, "PM_KISAN_001"
    )
    assert result == "CREATED"
    assert next_application.id != application.id
    assert get_next_transaction(pay_payload(application.id), db).submission_success.reference_number == submitted.success.reference_number
