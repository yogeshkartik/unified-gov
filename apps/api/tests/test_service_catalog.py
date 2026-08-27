import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.services.seed import seed_demo_services
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
