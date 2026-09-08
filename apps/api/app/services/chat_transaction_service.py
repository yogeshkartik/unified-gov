from datetime import UTC

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import ApplicationStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.chat_transaction import (
    PaymentCard,
    SubmissionConfirmation,
    SubmissionSuccess,
    TransactionComponentsResponse,
)
from app.schemas.payment import PaymentProcessResponse, SubmissionResponse
from app.services import application_engine, application_progress


def _successful_payment(db: Session, application_id: str) -> Payment | None:
    return db.scalar(
        select(Payment).where(
            Payment.application_id == application_id,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )


def _latest_payment(db: Session, application_id: str) -> Payment | None:
    return db.scalar(
        select(Payment)
        .where(Payment.application_id == application_id)
        .order_by(Payment.created_at.desc())
    )


def payment_card(
    db: Session,
    application_id: str,
    result: PaymentProcessResponse | None = None,
) -> PaymentCard:
    application = application_engine.get_application(db, application_id)
    payment = _successful_payment(db, application.id) or _latest_payment(
        db, application.id
    )
    return PaymentCard(
        application_id=application.id,
        amount=float(application.service.fee),
        currency=application.service.currency,
        payment_status=(
            str(result.status)
            if result is not None and result.status is not None
            else str(payment.status)
            if payment is not None
            else "PENDING"
        ),
        transaction_reference=(
            result.transaction_id
            if result is not None
            else payment.transaction_id
            if payment
            else None
        ),
        completed_at=(
            payment.completed_at.replace(tzinfo=UTC)
            if payment is not None
            and payment.completed_at is not None
            and payment.completed_at.tzinfo is None
            else payment.completed_at
            if payment is not None
            else None
        ),
    )


def submission_confirmation(db: Session, application_id: str) -> SubmissionConfirmation:
    application = application_engine.get_application(db, application_id)
    return SubmissionConfirmation(
        application_id=application.id,
        service_name=application.service.name,
    )


def submission_success(
    db: Session,
    application_id: str,
    result: SubmissionResponse | None = None,
) -> SubmissionSuccess:
    application = application_engine.get_application(db, application_id)
    reference = (
        result.government_reference_number
        if result is not None
        else application.government_reference_number
    )
    submitted_at = (
        result.submission_timestamp if result is not None else application.submitted_at
    )
    if reference is None or submitted_at is None:
        raise ValueError("Application is not submitted.")
    return SubmissionSuccess(
        application_id=application.id,
        service_name=application.service.name,
        reference_number=reference,
        submitted_at=submitted_at,
        status=str(result.status) if result is not None else str(application.status),
    )


def get_transaction_components(
    db: Session, application_id: str
) -> TransactionComponentsResponse:
    progress = application_progress.get_application_progress(db, application_id)
    if progress.next_stage == "PAYMENT":
        return TransactionComponentsResponse(
            payment_card=payment_card(db, application_id)
        )
    if progress.next_stage == "SUBMISSION":
        return TransactionComponentsResponse(
            submission_confirmation=submission_confirmation(db, application_id)
        )
    if progress.next_stage == "COMPLETE" and progress.status == ApplicationStatus.SUBMITTED:
        return TransactionComponentsResponse(
            submission_success=submission_success(db, application_id)
        )
    return TransactionComponentsResponse()
