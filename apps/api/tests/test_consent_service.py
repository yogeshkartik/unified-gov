import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.schemas.application import AdditionalDataUpdate
from app.services.application_engine import create_application, save_additional_data
from app.services.consent_service import ConsentAdditionalDataRequiredError, grant_consent
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'consent.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_consent_records_requested_data_documents_purpose_and_timestamp(db: Session) -> None:
    application = create_application(db, "DRIVING_LICENCE_001")
    save_additional_data(
        db,
        application.id,
        AdditionalDataUpdate(
            answers={"licence_type": "Learner Licence", "vehicle_class": "Two Wheeler"}
        ),
    )

    consent = grant_consent(db, application.id)

    assert consent.user_id == application.user_id
    assert consent.application_id == application.id
    assert consent.service_id == "DRIVING_LICENCE_001"
    assert consent.data_categories == [
        "full_name",
        "date_of_birth",
        "address",
        "licence_type",
        "vehicle_class",
    ]
    assert consent.document_types == ["PHOTOGRAPH", "IDENTITY_DOCUMENT"]
    assert len(consent.document_ids) == 1
    assert consent.purpose == "Driving Licence Application — Demo Application"
    assert consent.status == "GRANTED"
    assert consent.granted_at is not None


def test_consent_requires_all_required_additional_data(db: Session) -> None:
    application = create_application(db, "SCHOLARSHIP_001")

    with pytest.raises(ConsentAdditionalDataRequiredError) as error:
        grant_consent(db, application.id)

    assert error.value.missing_fields == ["course", "institution", "academic_year"]
