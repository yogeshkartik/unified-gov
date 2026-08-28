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


def test_list_services_returns_the_expanded_demo_catalog(db: Session) -> None:
    services = list_services(db)

    service_ids = {service.id for service in services}
    assert len(service_ids) == 23
    assert {
        "JEE_MAIN_001",
        "NEET_UG_001",
        "CUET_UG_001",
        "WBJEE_001",
        "SSC_CGL_001",
        "UPSC_CSE_001",
        "IBPS_PO_001",
        "PAN_CARD_001",
        "VOTER_ID_001",
        "PASSPORT_001",
        "NATIONAL_SCHOLARSHIP_001",
        "PM_KISAN_001",
        "INCOME_CERTIFICATE_001",
    }.issubset(service_ids)


def test_jee_main_requirements_use_the_generic_service_schema(db: Session) -> None:
    service = get_service(db, "JEE_MAIN_001")

    assert service.category == "Examinations"
    assert service.required_profile_fields == ["full_name", "date_of_birth", "gender", "address", "category", "education"]
    assert [field.key for field in service.fields] == ["exam_city", "paper_preference"]
    assert [requirement.document_type for requirement in service.document_requirements] == ["PHOTOGRAPH", "SIGNATURE", "MARKSHEET"]


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
