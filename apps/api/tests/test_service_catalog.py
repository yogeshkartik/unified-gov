import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models.service import ServiceFieldType
from app.services.seed import (
    DRIVING_LICENCE_APPLICATION_OPTIONS,
    INDIAN_VEHICLE_CLASS_OPTIONS,
    seed_demo_services,
)
from app.services.service_catalog import ServiceNotFoundError, get_service, list_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'services.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_list_services_returns_all_three_demo_catalog_entries(db: Session) -> None:
    services = list_services(db)

    assert {service.id for service in services} == {
        "RECRUITMENT_EXAM_001",
        "SCHOLARSHIP_001",
        "DRIVING_LICENCE_001",
    }


def test_scholarship_requirements_are_data_driven(db: Session) -> None:
    scholarship = get_service(db, "SCHOLARSHIP_001")

    assert scholarship.required_profile_fields == [
        "full_name",
        "date_of_birth",
        "address",
        "category",
        "education",
    ]
    assert [field.key for field in scholarship.fields] == ["course", "institution", "academic_year"]
    assert scholarship.fields[2].options == ["2026-27", "2027-28"]
    assert [requirement.document_type for requirement in scholarship.document_requirements] == [
        "INCOME_CERTIFICATE",
        "MARKSHEET",
    ]


def test_unknown_service_raises_not_found_error(db: Session) -> None:
    with pytest.raises(ServiceNotFoundError):
        get_service(db, "UNKNOWN_SERVICE")


def test_driving_licence_uses_indian_dropdown_options(db: Session) -> None:
    service = get_service(db, "DRIVING_LICENCE_001")
    fields = {field.key: field for field in service.fields}

    assert fields["licence_type"].label == "Application Type"
    assert fields["licence_type"].field_type == ServiceFieldType.SELECT
    assert fields["licence_type"].options == DRIVING_LICENCE_APPLICATION_OPTIONS
    assert fields["vehicle_class"].field_type == ServiceFieldType.SELECT
    assert fields["vehicle_class"].options == INDIAN_VEHICLE_CLASS_OPTIONS


def test_seed_refreshes_options_in_an_existing_database(db: Session) -> None:
    service = get_service(db, "DRIVING_LICENCE_001")
    service.fields[0].field_type = ServiceFieldType.TEXT
    service.fields[0].options = ["personal"]
    db.commit()

    seed_demo_services(db)
    db.refresh(service.fields[0])

    assert service.fields[0].field_type == ServiceFieldType.SELECT
    assert service.fields[0].options == DRIVING_LICENCE_APPLICATION_OPTIONS
