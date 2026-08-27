import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.schemas.profile import ProfileUpdate
from app.services.profile_service import get_profile, update_profile
from app.services.seed import seed_demo_citizen


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'profile.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_get_profile_returns_the_synthetic_demo_citizen(db: Session) -> None:
    profile = get_profile(db)

    assert profile.full_name == "Rahul Kumar"
    assert profile.email == "rahul.kumar@example.com"
    assert profile.addresses[0].city == "New Delhi"


def test_update_profile_persists_changes(db: Session) -> None:
    updated = update_profile(db, ProfileUpdate(nationality="Synthetic Demo Nationality"))

    assert updated.nationality == "Synthetic Demo Nationality"
    assert get_profile(db).nationality == "Synthetic Demo Nationality"
