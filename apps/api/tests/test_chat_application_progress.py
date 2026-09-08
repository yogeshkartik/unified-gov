import inspect
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.chat import start_application
from app.core.database import Base
from app.models.application import Application, ApplicationStatus
from app.models.profile import AddressType, Document, DocumentSource, DocumentType, Profile, User
from app.schemas.application import AdditionalDataUpdate
from app.schemas.application_progress import StartApplicationRequest
from app.schemas.chat import ChatRequest
from app.services import application_engine
from app.services.application_document_service import attach_my_documents
from app.services.application_progress import get_application_progress
from app.services.chat_service import TOOLS, chat, get_my_profile
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    from app.core.config import settings
    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'chat-progress.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_profile_tool_is_bound_to_current_citizen_and_minimizes_values(db: Session) -> None:
    result = get_my_profile(db)
    assert result.permanent_state == "Delhi"
    assert "full_name" in result.available_profile_fields
    assert not hasattr(result, "user_id")
    assert list(inspect.signature(get_my_profile).parameters) == ["db"]
    schema = next(tool for tool in TOOLS if tool["name"] == "get_my_profile")["parameters"]
    assert schema == {"type": "object", "properties": {}, "additionalProperties": False}


def test_start_creates_normal_application_then_resumes_without_duplicate(db: Session) -> None:
    first = start_application(StartApplicationRequest(service_id="PM_KISAN_001"), db)
    second = start_application(StartApplicationRequest(service_id="PM_KISAN_001"), db)
    persisted = list(db.scalars(select(Application).where(Application.service_id == "PM_KISAN_001")).all())
    assert first.result == "CREATED"
    assert second.result == "RESUMED"
    assert second.application_id == first.application_id
    assert first.next_question is not None and first.next_question.type == "BOOLEAN_QUESTION"
    assert [application.id for application in persisted] == [first.application_id]


def test_start_rejects_invalid_inactive_and_wrong_state_services(db: Session) -> None:
    with pytest.raises(application_engine.ServiceNotAvailableError):
        application_engine.create_or_resume_application(db, "CUET_UG_001")
    with pytest.raises(Exception) as invalid:
        application_engine.create_or_resume_application(db, "NOT_REAL")
    assert type(invalid.value).__name__ == "ServiceNotFoundError"
    with pytest.raises(application_engine.ServiceJurisdictionError):
        application_engine.create_or_resume_application(db, "KA_INCOME_CERTIFICATE_001")

    profile = db.scalar(select(Profile))
    permanent = next(address for address in profile.addresses if address.type == AddressType.PERMANENT)
    permanent.state = "Karnataka"
    db.commit()
    result, application = application_engine.create_or_resume_application(db, "KA_INCOME_CERTIFICATE_001")
    assert result == "CREATED"
    assert application.service_id == "KA_INCOME_CERTIFICATE_001"


def test_progress_enforces_ownership_and_reports_live_profile_and_fields(db: Session) -> None:
    _, created = application_engine.create_or_resume_application(db, "PM_KISAN_001")
    progress = get_application_progress(db, created.id)
    assert progress.service.id == "PM_KISAN_001"
    assert progress.profile.missing == []
    assert [field.key for field in progress.application_fields.missing] == ["farmer_declaration"]
    assert progress.next_stage == "ADDITIONAL_INFORMATION"
    assert progress.payment.required is False
    assert progress.payment.status == "NOT_REQUIRED"

    application_engine.save_additional_data(db, created.id, AdditionalDataUpdate(answers={"farmer_declaration": False}))
    progress = get_application_progress(db, created.id)
    assert progress.application_fields.satisfied[0].value is False
    assert progress.application_fields.missing == []
    assert progress.next_stage == "DOCUMENTS"

    profile = db.scalar(select(Profile))
    profile.full_name = ""
    db.commit()
    progress = get_application_progress(db, created.id)
    assert progress.profile.missing == ["full_name"]
    assert progress.next_stage == "PROFILE"

    other = User(email="other@example.test", auth_state="DEMO")
    db.add(other); db.flush()
    foreign = Application(user_id=other.id, service_id="PM_KISAN_001", status=ApplicationStatus.DRAFT)
    db.add(foreign); db.commit()
    with pytest.raises(application_engine.ApplicationNotFoundError):
        get_application_progress(db, foreign.id)


def test_document_progress_reuses_unambiguous_saved_documents(db: Session) -> None:
    _, created = application_engine.create_or_resume_application(db, "NATIONAL_SCHOLARSHIP_001")
    initial = get_application_progress(db, created.id)
    assert {item.document_type for item in initial.documents.missing} == {"INCOME_CERTIFICATE", "MARKSHEET"}

    marksheet = Document(
        user_id=created.user_id, name="Uploaded marksheet", document_type=DocumentType.MARKSHEET,
        source=DocumentSource.PROFILE_UPLOAD, storage_key="test/marksheet.pdf",
    )
    db.add(marksheet); db.commit()
    # A sole compatible saved document is attached before progress is returned.
    updated = get_application_progress(db, created.id)
    assert "MARKSHEET" not in {item.document_type for item in updated.documents.missing}
    assert any(item.document_id == marksheet.id for item in updated.documents.satisfied)
    attach_my_documents(db, created.id, [marksheet.id])
    updated = get_application_progress(db, created.id)
    assert {item.document_type for item in updated.documents.satisfied} == {"MARKSHEET"}
    assert updated.documents.satisfied[0].document_id == marksheet.id
    assert {item.document_type for item in updated.documents.missing} == {"INCOME_CERTIFICATE"}


def test_progress_reads_consent_payment_and_final_state_without_mutation(db: Session) -> None:
    _, created = application_engine.create_or_resume_application(db, "PM_KISAN_001")
    progress = get_application_progress(db, created.id)
    assert progress.consent.status == "PENDING"
    assert progress.consent.granted is False
    assert progress.submission_status == "NOT_READY"

    application = application_engine.get_application(db, created.id)
    application.status = ApplicationStatus.SUBMITTED
    db.commit()
    final = get_application_progress(db, created.id)
    assert final.next_stage == "COMPLETE"
    assert final.submission_status == "SUBMITTED"
    assert application_engine.create_or_resume_application(db, "PM_KISAN_001")[0] == "CREATED"


def test_free_form_apply_orchestration_uses_tools_and_returns_progress(db: Session) -> None:
    class ApplyProvider:
        def __init__(self): self.step = 0; self.application_id = None
        def respond(self, items):
            self.step += 1
            if self.step == 1: return SimpleNamespace(output=[SimpleNamespace(type="function_call", name="search_services", arguments='{"query":"PM-KISAN"}', call_id="search")], output_text="")
            if self.step == 2: return SimpleNamespace(output=[SimpleNamespace(type="function_call", name="get_service_details", arguments='{"service_id":"PM_KISAN_001"}', call_id="details")], output_text="")
            if self.step == 3: return SimpleNamespace(output=[SimpleNamespace(type="function_call", name="create_or_resume_application", arguments='{"service_id":"PM_KISAN_001"}', call_id="create")], output_text="")
            create_output = next(item for item in reversed(items) if isinstance(item, dict) and item.get("call_id") == "create")
            import json
            self.application_id = json.loads(create_output["output"])["application_id"]
            if self.step == 4: return SimpleNamespace(output=[SimpleNamespace(type="function_call", name="get_application_progress", arguments=json.dumps({"application_id": self.application_id}), call_id="progress")], output_text="")
            return SimpleNamespace(output=[], output_text="I've started your PM-KISAN application.")

    provider = ApplyProvider()
    response = chat(db, ChatRequest(message="I want to apply for PM-KISAN"), provider)
    assert provider.step == 5
    assert any(component.type == "APPLICATION_PROGRESS" for component in response.components)
    assert any(component.type == "BOOLEAN_QUESTION" for component in response.components)
    assert db.get(Application, provider.application_id) is not None
