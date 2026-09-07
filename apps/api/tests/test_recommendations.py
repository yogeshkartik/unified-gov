from datetime import date

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.models.profile import Address, AddressType, Education, EducationLevel, Profile
from app.services.recommendations import recommend_services
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    from app.core.config import settings
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'recommendations.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_recommendations_use_permanent_not_correspondence_state(db: Session) -> None:
    profile = db.scalar(select(Profile))
    assert profile is not None
    profile.user.addresses[0].state = "Bihar"
    profile.user.addresses.append(Address(type=AddressType.CORRESPONDENCE, line1="Hostel", line2=None, city="Bengaluru", district="Bengaluru", state="Karnataka", pincode="560001", country="India"))
    profile.user.education_records.append(Education(level=EducationLevel.TWELFTH, board_or_university="Demo Board", institution="Demo School", year=2026))
    db.commit()

    ids = [item.service.id for item in recommend_services(db)]

    assert "BR_STATE_MERIT_SCHOLARSHIP_001" in ids
    assert all(not service_id.startswith("KA_") for service_id in ids)


def test_incomplete_profile_has_generic_recommendations(db: Session) -> None:
    profile = db.scalar(select(Profile))
    assert profile is not None
    profile.user.addresses.clear()
    profile.user.education_records.clear()
    profile.current_education_status = None
    profile.date_of_birth = date(1990, 1, 1)
    db.commit()

    ids = [item.service.id for item in recommend_services(db)]

    assert "PAN_CARD_001" in ids
    assert "PASSPORT_001" in ids
