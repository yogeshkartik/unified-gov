from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.integrations.government import government_submission_provider
from app.integrations.government.provider import GovernmentSubmissionProvider
from app.integrations.payment import payment_provider
from app.integrations.payment.provider import PaymentProvider
from app.models.application import Application, ApplicationSnapshot, ApplicationStatus
from app.models.consent import Consent, ConsentStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import PaymentProcessResponse, SubmissionResponse
from app.services import application_engine
from app.services.preview_service import get_or_create_snapshot, get_preview


class ApplicationSnapshotRequiredError(Exception):
    pass


class SuccessfulPaymentRequiredError(Exception):
    pass


class ApplicationIncompleteForTransactionError(Exception):
    def __init__(
        self,
        missing_profile_fields: list[str],
        missing_documents: list[str],
        missing_fields: list[str],
    ) -> None:
        self.missing_profile_fields = missing_profile_fields
        self.missing_documents = missing_documents
        self.missing_fields = missing_fields
        super().__init__("Application requirements are incomplete.")


class ConsentRequiredForTransactionError(Exception):
    pass


class PaymentNotRequiredError(Exception):
    pass


class InvalidTransactionStageError(Exception):
    pass


class TerminalApplicationTransactionError(Exception):
    pass


TERMINAL_STATUSES = {
    ApplicationStatus.SUBMITTED,
    ApplicationStatus.PROCESSING,
    ApplicationStatus.COMPLETED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.CANCELLED,
}


def _utc_timestamp(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def _locked_application(db: Session, application_id: str) -> Application:
    application = application_engine.get_application(db, application_id)
    db.scalar(
        select(Application.id)
        .where(Application.id == application.id, Application.user_id == application.user_id)
        .with_for_update()
    )
    db.refresh(application)
    return application_engine.get_application(db, application.id)


def _validate_requirements(db: Session, application: Application) -> None:
    missing_profile, missing_documents, missing_fields = (
        application_engine.determine_missing_requirements(db, application)
    )
    if missing_profile or missing_documents or missing_fields:
        raise ApplicationIncompleteForTransactionError(
            missing_profile, missing_documents, missing_fields
        )


def _require_consent(db: Session, application: Application) -> None:
    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    if consent is None or consent.status != ConsentStatus.GRANTED:
        raise ConsentRequiredForTransactionError


def process_payment(
    db: Session,
    application_id: str,
    provider: PaymentProvider = payment_provider,
) -> PaymentProcessResponse:
    application = _locked_application(db, application_id)
    if application.status in TERMINAL_STATUSES:
        raise TerminalApplicationTransactionError
    amount = float(application.service.fee)
    _validate_requirements(db, application)
    _require_consent(db, application)
    if application.status not in {
        ApplicationStatus.READY_FOR_REVIEW,
        ApplicationStatus.PAYMENT_REQUIRED,
    }:
        raise InvalidTransactionStageError
    if amount <= 0:
        return PaymentProcessResponse(
            application_id=application.id,
            skipped=True,
            status=None,
            transaction_id=None,
            amount=amount,
            currency=application.service.currency,
        )

    existing_success = db.scalar(
        select(Payment).where(
            Payment.application_id == application.id,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )
    if existing_success is not None:
        return payment_response(application.id, existing_success)

    live_application = get_preview(db, application.id).model_dump(mode="json")
    result = provider.create_payment(
        live_application, amount, application.service.currency
    )
    payment_status = PaymentStatus(provider.get_payment_status(result.transaction_id))
    payment = Payment(
        application_id=application.id,
        provider=type(provider).__name__,
        transaction_id=result.transaction_id,
        amount=amount,
        currency=application.service.currency,
        status=payment_status,
        completed_at=datetime.now(UTC),
    )
    db.add(payment)
    if payment_status == PaymentStatus.SUCCESS:
        application.status = ApplicationStatus.READY_FOR_REVIEW
    else:
        application.status = ApplicationStatus.PAYMENT_REQUIRED
    db.commit()
    db.refresh(payment)
    return payment_response(application.id, payment)


def submit_application(
    db: Session,
    application_id: str,
    provider: GovernmentSubmissionProvider = government_submission_provider,
) -> SubmissionResponse:
    application = _locked_application(db, application_id)
    if (
        application.status == ApplicationStatus.SUBMITTED
        and application.government_reference_number is not None
        and application.submitted_at is not None
    ):
        return SubmissionResponse(
            application_id=application.id,
            government_reference_number=application.government_reference_number,
            submission_timestamp=_utc_timestamp(application.submitted_at),
            status=application.status,
        )
    if application.status in TERMINAL_STATUSES:
        raise TerminalApplicationTransactionError

    _validate_requirements(db, application)
    _require_consent(db, application)
    if application.status != ApplicationStatus.READY_FOR_REVIEW:
        raise InvalidTransactionStageError
    if float(application.service.fee) > 0:
        payment = db.scalar(
            select(Payment).where(
                Payment.application_id == application.id,
                Payment.status == PaymentStatus.SUCCESS,
            )
        )
        if payment is None:
            raise SuccessfulPaymentRequiredError

    snapshot = get_or_create_snapshot(
        db, application, status=ApplicationStatus.SUBMITTED
    )

    try:
        result = provider.submit(snapshot.snapshot_json)
        application.government_reference_number = result.government_reference_number
        application.submitted_at = result.submission_timestamp
        application.status = ApplicationStatus.SUBMITTED
        db.commit()
    except IntegrityError:
        db.rollback()
        application = application_engine.get_application(db, application_id)
        if (
            application.status == ApplicationStatus.SUBMITTED
            and application.government_reference_number is not None
            and application.submitted_at is not None
        ):
            return SubmissionResponse(
                application_id=application.id,
                government_reference_number=application.government_reference_number,
                submission_timestamp=_utc_timestamp(application.submitted_at),
                status=application.status,
            )
        raise
    except Exception:
        db.rollback()
        raise
    return SubmissionResponse(
        application_id=application.id,
        government_reference_number=result.government_reference_number,
        submission_timestamp=_utc_timestamp(result.submission_timestamp),
        status=ApplicationStatus.SUBMITTED,
    )


def get_snapshot(db: Session, application_id: str) -> ApplicationSnapshot:
    snapshot = db.scalar(
        select(ApplicationSnapshot).where(ApplicationSnapshot.application_id == application_id)
    )
    if snapshot is None:
        raise ApplicationSnapshotRequiredError
    return snapshot


def payment_response(application_id: str, payment: Payment) -> PaymentProcessResponse:
    return PaymentProcessResponse(
        application_id=application_id,
        skipped=False,
        status=payment.status,
        transaction_id=payment.transaction_id,
        amount=float(payment.amount),
        currency=payment.currency,
    )
