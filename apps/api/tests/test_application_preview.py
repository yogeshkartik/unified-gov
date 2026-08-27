import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models.application import ApplicationDocument
from app.models.profile import Document
from app.schemas.application import AdditionalDataUpdate
from app.schemas.profile import ProfileUpdate
from app.services.application_engine import create_application, save_additional_data
from app.services.consent_service import grant_consent
from app.services.preview_service import finalize_application, get_preview
from app.services.profile_service import update_profile
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'preview.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def complete_driving_licence_application(db: Session) -> str:
    application = create_application(db, "DRIVING_LICENCE_001")
    save_additional_data(
        db,
        application.id,
        AdditionalDataUpdate(
            answers={
                "licence_type": "Learner's Licence",
                "vehicle_class": "MCWG — Motorcycle with gear",
            }
        ),
    )
    photograph = db.scalar(select(Document).where(Document.document_type == "PHOTOGRAPH"))
    assert photograph is not None
    db.add(ApplicationDocument(application_id=application.id, document_id=photograph.id))
    db.commit()
    grant_consent(db, application.id)
    return application.id


def test_preview_combines_profile_education_documents_answers_service_and_fee(db: Session) -> None:
    application_id = complete_driving_licence_application(db)

    preview = get_preview(db, application_id)

    assert preview.profile["full_name"] == "Rahul Kumar"
    assert preview.education[0]["level"] == "12TH"
    assert preview.documents[0]["document_type"] == "PHOTOGRAPH"
    assert preview.answers == {
        "licence_type": "Learner's Licence",
        "vehicle_class": "MCWG — Motorcycle with gear",
    }
    assert preview.service["name"] == "Driving Licence Application"
    assert preview.fee == 200
    assert preview.currency == "INR"


def test_final_snapshot_is_immutable_after_profile_changes(db: Session) -> None:
    application_id = complete_driving_licence_application(db)

    snapshot = finalize_application(db, application_id)
    update_profile(db, ProfileUpdate(full_name="Updated Synthetic Citizen"))

    live_preview = get_preview(db, application_id)
    repeated_finalization = finalize_application(db, application_id)

    assert snapshot.snapshot_json["profile"]["full_name"] == "Rahul Kumar"
    assert live_preview.profile["full_name"] == "Updated Synthetic Citizen"
    assert repeated_finalization.id == snapshot.id
    assert repeated_finalization.snapshot_json == snapshot.snapshot_json
