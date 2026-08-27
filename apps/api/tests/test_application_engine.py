import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.schemas.application import AdditionalDataUpdate
from app.services.application_engine import (
    InvalidApplicationFieldsError,
    create_application,
    get_application,
    save_additional_data,
)
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


def test_application_creation_creates_a_draft_for_the_selected_service(db: Session) -> None:
    response = create_application(db, "SCHOLARSHIP_001")

    assert response.status == "DRAFT"
    assert response.service_id == "SCHOLARSHIP_001"
    assert get_application(db, response.id).service_id == "SCHOLARSHIP_001"


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
    assert updated.answers == {
        "course": "Computer Science",
        "institution": "Demo Institute",
        "academic_year": "2026-27",
    }
