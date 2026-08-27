from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.government import government_submission_provider
from app.integrations.government.provider import GovernmentSubmissionProvider
from app.integrations.payment import payment_provider
from app.integrations.payment.provider import PaymentProvider
from app.models.application import ApplicationSnapshot, ApplicationStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import PaymentProcessResponse, SubmissionResponse
from app.services import application_engine


class ApplicationSnapshotRequiredError(Exception):
    pass


class SuccessfulPaymentRequiredError(Exception):
    pass


def process_payment(
    db: Session,
    application_id: str,
    provider: PaymentProvider = payment_provider,
) -> PaymentProcessResponse:
    application = application_engine.get_application(db, application_id)
    snapshot = get_snapshot(db, application.id)
    amount = float(application.service.fee)
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

    result = provider.create_payment(snapshot.snapshot_json, amount, application.service.currency)
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
    application = application_engine.get_application(db, application_id)
    snapshot = get_snapshot(db, application.id)
    if application.government_reference_number is not None and application.submitted_at is not None:
        return SubmissionResponse(
            application_id=application.id,
            government_reference_number=application.government_reference_number,
            submission_timestamp=application.submitted_at,
            status=application.status,
        )
    if float(application.service.fee) > 0:
        payment = db.scalar(
            select(Payment).where(
                Payment.application_id == application.id,
                Payment.status == PaymentStatus.SUCCESS,
            )
        )
        if payment is None:
            raise SuccessfulPaymentRequiredError

    result = provider.submit(snapshot.snapshot_json)
    application.government_reference_number = result.government_reference_number
    application.submitted_at = result.submission_timestamp
    application.status = ApplicationStatus.SUBMITTED
    db.commit()
    return SubmissionResponse(
        application_id=application.id,
        government_reference_number=result.government_reference_number,
        submission_timestamp=result.submission_timestamp,
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
