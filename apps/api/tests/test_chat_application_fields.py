import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.chat import set_application_field as set_field_action
from app.core.database import Base
from app.models.application import Application, ApplicationAnswer, ApplicationStatus
from app.models.profile import AddressType, Profile, User
from app.models.service import Service, ServiceField, ServiceStatus
from app.schemas.application_progress import SetApplicationFieldRequest
from app.services import application_engine
from app.services.application_progress import QUESTION_TYPES, get_application_progress, get_next_application_question
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    from app.core.config import settings
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'chat-fields.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_active_field_type_inventory_is_fully_supported(db: Session) -> None:
    active_types = set(db.scalars(select(ServiceField.field_type).join(Service).where(Service.status == ServiceStatus.OPEN)).all())
    assert active_types == {"checkbox", "number", "select", "text", "textarea"}
    assert active_types <= set(QUESTION_TYPES)


def test_owner_sets_text_in_normal_answer_store_and_can_update_idempotently(db: Session) -> None:
    application = application_engine.create_application(db, "E_SHRAM_001")
    value, _ = application_engine.set_application_field(db, application.id, "occupation", "Carpenter")
    assert value == "Carpenter"
    assert application_engine.get_application(db, application.id).answers_by_key == {"occupation": "Carpenter"}

    application_engine.set_application_field(db, application.id, "occupation", "Electrician")
    application_engine.set_application_field(db, application.id, "occupation", "Electrician")
    count = db.scalar(select(func.count()).select_from(ApplicationAnswer).where(ApplicationAnswer.application_id == application.id))
    assert count == 1
    assert application_engine.get_application(db, application.id).answers_by_key["occupation"] == "Electrician"


def test_field_mutation_enforces_ownership_application_field_and_editability(db: Session) -> None:
    application = application_engine.create_application(db, "JEE_MAIN_001")
    with pytest.raises(application_engine.ApplicationFieldNotFoundError):
        application_engine.set_application_field(db, application.id, "status", "SUBMITTED")
    with pytest.raises(application_engine.ApplicationFieldNotFoundError):
        application_engine.set_application_field(db, application.id, "farmer_declaration", True)
    with pytest.raises(application_engine.ApplicationNotFoundError):
        application_engine.set_application_field(db, "not-an-application", "exam_city", "Bengaluru")

    other = User(email="other-fields@example.test", auth_state="DEMO")
    db.add(other); db.flush()
    foreign = Application(user_id=other.id, service_id="JEE_MAIN_001", status=ApplicationStatus.ADDITIONAL_INFO_REQUIRED)
    db.add(foreign); db.commit()
    with pytest.raises(application_engine.ApplicationNotFoundError):
        application_engine.set_application_field(db, foreign.id, "exam_city", "Bengaluru")

    owned = application_engine.get_application(db, application.id)
    owned.status = ApplicationStatus.READY_FOR_REVIEW
    db.commit()
    with pytest.raises(application_engine.ApplicationNotEditableError):
        application_engine.set_application_field(db, application.id, "exam_city", "Bengaluru")


def test_select_uses_canonical_options_and_progress_advances_in_schema_order(db: Session) -> None:
    application = application_engine.create_application(db, "JEE_MAIN_001")
    question = get_next_application_question(db, application.id)
    assert question is not None
    assert question.type == "SELECT_QUESTION"
    assert question.field.key == "exam_city"
    assert question.field.options == ["New Delhi", "Mumbai", "Bengaluru"]

    with pytest.raises(application_engine.InvalidApplicationFieldsError):
        application_engine.set_application_field(db, application.id, "exam_city", "Pune")
    assert get_next_application_question(db, application.id).field.key == "exam_city"

    saved, _ = application_engine.set_application_field(db, application.id, "exam_city", "Bengaluru")
    assert saved == "Bengaluru"
    progress = get_application_progress(db, application.id)
    assert [field.key for field in progress.application_fields.missing] == ["paper_preference"]
    assert get_next_application_question(db, application.id).field.key == "paper_preference"

    application_engine.set_application_field(db, application.id, "paper_preference", "Paper 1")
    assert get_next_application_question(db, application.id) is None
    assert get_application_progress(db, application.id).application_fields.missing == []


@pytest.mark.parametrize("value", [True, False])
def test_boolean_values_remain_booleans_and_false_is_complete(db: Session, value: bool) -> None:
    application = application_engine.create_application(db, "PM_KISAN_001")
    question = get_next_application_question(db, application.id)
    assert question is not None and question.type == "BOOLEAN_QUESTION"
    saved, _ = application_engine.set_application_field(db, application.id, "farmer_declaration", value)
    assert saved is value
    assert application_engine.get_application(db, application.id).answers_by_key["farmer_declaration"] is value
    assert get_application_progress(db, application.id).application_fields.missing == []


def test_existing_legacy_boolean_normalizer_never_stores_string(db: Session) -> None:
    application = application_engine.create_application(db, "PM_KISAN_001")
    saved, _ = application_engine.set_application_field(db, application.id, "farmer_declaration", "yes")
    assert saved is True
    assert application_engine.get_application(db, application.id).answers_by_key["farmer_declaration"] is True
    with pytest.raises(application_engine.InvalidApplicationFieldsError):
        application_engine.set_application_field(db, application.id, "farmer_declaration", "maybe")


def test_number_textarea_and_required_empty_validation(db: Session) -> None:
    number_application = application_engine.create_application(db, "AYUSHMAN_BHARAT_001")
    assert get_next_application_question(db, number_application.id).type == "NUMBER_QUESTION"
    saved, _ = application_engine.set_application_field(db, number_application.id, "household_size", 5)
    assert saved == 5
    with pytest.raises(application_engine.InvalidApplicationFieldsError):
        application_engine.set_application_field(db, number_application.id, "household_size", "five")

    textarea_application = application_engine.create_application(db, "PMAY_001")
    assert get_next_application_question(db, textarea_application.id).type == "TEXTAREA_QUESTION"
    with pytest.raises(application_engine.InvalidApplicationFieldsError) as empty:
        application_engine.set_application_field(db, textarea_application.id, "housing_need", "  ")
    assert empty.value.fields == {"housing_need": "This field is required."}


def test_deterministic_action_refreshes_progress_and_next_question(db: Session) -> None:
    application = application_engine.create_application(db, "JEE_MAIN_001")
    result = set_field_action(SetApplicationFieldRequest(application_id=application.id, field_key="exam_city", value="Mumbai"), db)
    assert result.saved_value == "Mumbai"
    assert result.next_question is not None and result.next_question.field.key == "paper_preference"
    assert [field.key for field in result.progress.application_fields.missing] == ["paper_preference"]

    with pytest.raises(HTTPException) as invalid:
        set_field_action(SetApplicationFieldRequest(application_id=application.id, field_key="exam_city", value="Invalid"), db)
    assert invalid.value.status_code == 422


def test_resume_skips_saved_fields_and_recomputes_applicability(db: Session, monkeypatch) -> None:
    application = application_engine.create_application(db, "JEE_MAIN_001")
    application_engine.set_application_field(db, application.id, "exam_city", "New Delhi")
    result, resumed = application_engine.create_or_resume_application(db, "JEE_MAIN_001")
    assert result == "RESUMED"
    assert resumed.id == application.id
    assert get_next_application_question(db, resumed.id).field.key == "paper_preference"

    original = application_engine.active_service_fields
    monkeypatch.setattr(
        application_engine,
        "active_service_fields",
        lambda fields, answers: [field for field in original(fields, answers) if field.key != "paper_preference"] if answers.get("exam_city") == "New Delhi" else original(fields, answers),
    )
    # The shared applicability hook is re-run from current answers after every save.
    assert get_next_application_question(db, resumed.id) is None
    with pytest.raises(application_engine.ApplicationFieldNotApplicableError):
        application_engine.set_application_field(db, resumed.id, "paper_preference", "Paper 1")


def test_karnataka_income_certificate_text_answer_persists_across_resume(db: Session) -> None:
    profile = db.scalar(select(Profile))
    permanent = next(address for address in profile.addresses if address.type == AddressType.PERMANENT)
    permanent.state = "Karnataka"
    db.commit()
    _, application = application_engine.create_or_resume_application(db, "KA_INCOME_CERTIFICATE_001")
    question = get_next_application_question(db, application.id)
    assert question is not None and question.type == "TEXT_QUESTION"
    assert question.field.key == "certificate_purpose"
    application_engine.set_application_field(db, application.id, "certificate_purpose", "Scholarship verification")

    result, resumed = application_engine.create_or_resume_application(db, "KA_INCOME_CERTIFICATE_001")
    assert result == "RESUMED"
    assert resumed.answers["certificate_purpose"] == "Scholarship verification"
    assert get_next_application_question(db, resumed.id) is None
