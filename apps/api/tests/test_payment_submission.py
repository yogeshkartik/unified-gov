import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.integrations.payment.mock import MockPaymentProvider
from app.models.application import Application, ApplicationStatus
from app.models.payment import Payment, PaymentStatus
from app.schemas.application import AdditionalDataUpdate
from app.services.application_engine import create_application, save_additional_data
from app.services.consent_service import grant_consent
from app.services.digilocker_service import select_application_documents
from app.services.payment_submission_service import process_payment, submit_application
from app.services.preview_service import finalize_application
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'payments.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def finalized_application(db: Session, service_id: str) -> str:
    application = create_application(db, service_id)
    answers = (
        {
            "licence_type": "Learner's Licence",
            "vehicle_class": "MCWG — Motorcycle with gear",
        }
        if service_id == "DRIVING_LICENCE_001"
        else {
            "course": "Computer Science",
            "institution": "Demo Institute",
            "academic_year": "2026-27",
        }
    )
    save_additional_data(db, application.id, AdditionalDataUpdate(answers=answers))
    provider_documents = (
        ["mock-driving-licence"]
        if service_id == "DRIVING_LICENCE_001"
        else ["mock-class-12", "mock-income"]
    )
    select_application_documents(db, application.id, provider_documents)
    grant_consent(db, application.id)
    finalize_application(db, application.id)
    return application.id


def test_paid_service_creates_a_successful_mock_payment(db: Session) -> None:
    application_id = finalized_application(db, "DRIVING_LICENCE_001")

    payment = process_payment(db, application_id)

    assert payment.skipped is False
    assert payment.status == PaymentStatus.SUCCESS
    assert payment.transaction_id is not None and payment.transaction_id.startswith("TXN-")
    assert payment.amount == 200
    assert db.get(Application, application_id).status == ApplicationStatus.READY_FOR_REVIEW


def test_free_service_skips_payment(db: Session) -> None:
    application_id = finalized_application(db, "SCHOLARSHIP_001")

    payment = process_payment(db, application_id)

    assert payment.skipped is True
    assert payment.status is None
    assert db.scalar(select(Payment).where(Payment.application_id == application_id)) is None
    assert db.get(Application, application_id).status == ApplicationStatus.READY_FOR_REVIEW


def test_mock_payment_failure_keeps_application_payment_required(db: Session) -> None:
    application_id = finalized_application(db, "DRIVING_LICENCE_001")

    payment = process_payment(db, application_id, provider=MockPaymentProvider(force_failure=True))
    application = db.scalar(select(Application).where(Application.id == application_id))

    assert payment.status == PaymentStatus.FAILED
    assert application is not None and application.status == ApplicationStatus.PAYMENT_REQUIRED


def test_mock_submission_generates_reference_and_marks_application_submitted(db: Session) -> None:
    application_id = finalized_application(db, "DRIVING_LICENCE_001")
    process_payment(db, application_id)

    submission = submit_application(db, application_id)
    application = db.scalar(select(Application).where(Application.id == application_id))

    assert submission.government_reference_number.startswith("GOV-")
    assert submission.status == ApplicationStatus.SUBMITTED
    assert application is not None
    assert application.government_reference_number == submission.government_reference_number
    assert application.status == ApplicationStatus.SUBMITTED
