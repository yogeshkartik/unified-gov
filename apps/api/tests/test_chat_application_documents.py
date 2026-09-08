import asyncio
import json
from types import SimpleNamespace
import pytest
from fastapi import HTTPException, UploadFile
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import Session, sessionmaker

from app.api.chat import attach_document as attach_document_action
from app.api.chat import import_digilocker_document as import_digilocker_action
from app.api.chat import upload_document as upload_document_action
from app.core.database import Base
from app.integrations.digilocker.provider import ProviderConsent, ProviderDocument
from app.models.application import Application, ApplicationDocument, ApplicationStatus
from app.models.profile import AddressType, Document, DocumentSource, DocumentType, Profile, User
from app.models.service import Service, ServiceDocumentRequirement, ServiceStatus
from app.schemas.application_progress import ApplicationDocumentActionRequest
from app.schemas.chat import ChatRequest
from app.services import application_document_service, application_engine, application_progress, digilocker_service, profile_service
from app.services.chat_service import TOOLS, chat
from app.services.seed import seed_demo_citizen, seed_demo_services


@pytest.fixture
def db(tmp_path, monkeypatch) -> Session:
    from app.core.config import settings

    monkeypatch.setattr(settings, "upload_dir", str(tmp_path / "uploads"))
    engine = create_engine(f"sqlite:///{tmp_path / 'chat-documents.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_citizen(session)
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def complete_pm_kisan_field(db: Session):
    application = application_engine.create_application(db, "PM_KISAN_001")
    application_engine.set_application_field(
        db, application.id, "farmer_declaration", True
    )
    return application_engine.get_application(db, application.id)


def owned_document(db: Session, application: Application, document_type: str, name: str) -> Document:
    document = Document(
        user_id=application.user_id,
        name=name,
        display_name=name,
        document_type=document_type,
        source=DocumentSource.PROFILE_UPLOAD,
        storage_key=f"test/{name}.pdf",
    )
    db.add(document)
    db.commit()
    return document


def upload(filename: str, content_type: str, content: bytes) -> UploadFile:
    class SyntheticUpload:
        async def read(self) -> bytes:
            return content

    synthetic = SyntheticUpload()
    synthetic.filename = filename
    synthetic.content_type = content_type
    return synthetic  # type: ignore[return-value]


def test_active_required_document_inventory_is_uploadable_and_has_single_file_semantics(
    db: Session,
) -> None:
    services = list(db.scalars(select(Service).where(Service.status == ServiceStatus.OPEN)).all())
    supported = {item.value for item in DocumentType}
    for service in services:
        types = [item.document_type for item in service.document_requirements if item.required]
        assert set(types) <= supported
        assert len(types) == len(set(types))


def test_candidate_listing_is_requirement_focused_owned_and_backend_ordered(db: Session) -> None:
    application = complete_pm_kisan_field(db)
    licence = owned_document(db, application, "DRIVING_LICENCE", "My driving licence")
    second_licence = owned_document(db, application, "DRIVING_LICENCE", "My other driving licence")
    owned_document(db, application, DocumentType.INCOME_CERTIFICATE, "Unrelated income")
    foreign = User(email="foreign-documents@example.test", auth_state="DEMO")
    db.add(foreign)
    db.flush()
    db.add(
        Document(
            user_id=foreign.id,
            name="Foreign licence",
            document_type="DRIVING_LICENCE",
            source=DocumentSource.PROFILE_UPLOAD,
        )
    )
    db.commit()

    request = application_document_service.get_next_document_request(db, application.id)

    assert request is not None
    assert request.requirement.document_type == "IDENTITY_DOCUMENT"
    assert {item.document_id for item in request.existing_documents} == {licence.id, second_licence.id}
    assert [item.document_id for item in request.digilocker_options] == ["mock-driving-licence"]
    assert request.upload_allowed is True
    assert application_progress.get_application_progress(db, application.id).documents.missing[0].requirement_id == request.requirement.id


def test_listing_rejects_foreign_application_and_waits_for_fields(db: Session) -> None:
    incomplete = application_engine.create_application(db, "PM_KISAN_001")
    assert application_document_service.get_next_document_request(db, incomplete.id) is None

    other = User(email="other-app@example.test", auth_state="DEMO")
    db.add(other)
    db.flush()
    foreign = Application(
        user_id=other.id,
        service_id="PM_KISAN_001",
        status=ApplicationStatus.CONSENT_REQUIRED,
    )
    db.add(foreign)
    db.commit()
    with pytest.raises(application_engine.ApplicationNotFoundError):
        application_document_service.get_next_document_request(db, foreign.id)


def test_owned_compatible_attachment_is_canonical_persistent_and_idempotent(db: Session) -> None:
    application = complete_pm_kisan_field(db)
    document = owned_document(db, application, "DRIVING_LICENCE", "Driving licence")
    owned_document(db, application, "DRIVING_LICENCE", "Another driving licence")
    requirement = application_document_service.get_next_document_request(db, application.id).requirement

    result = attach_document_action(
        ApplicationDocumentActionRequest(
            application_id=application.id,
            requirement_id=requirement.id,
            document_id=document.id,
        ),
        db,
    )
    repeated = attach_document_action(
        ApplicationDocumentActionRequest(
            application_id=application.id,
            requirement_id=requirement.id,
            document_id=document.id,
        ),
        db,
    )

    assert result.progress.documents.satisfied[0].document_id == document.id
    assert result.next_document is not None
    assert result.next_document.requirement.document_type == "OTHER"
    assert result.next_document.existing_documents == []
    assert result.next_document.digilocker_options == []
    assert result.next_document.upload_allowed is True
    assert repeated.progress.documents.satisfied[0].document_id == document.id
    assert db.scalar(
        select(func.count()).select_from(ApplicationDocument).where(
            ApplicationDocument.application_id == application.id,
            ApplicationDocument.document_id == document.id,
        )
    ) == 1
    assert application_progress.get_application_progress(db, application.id).documents.satisfied[0].document_id == document.id
    resume_result, resumed = application_engine.create_or_resume_application(db, "PM_KISAN_001")
    assert resume_result == "RESUMED"
    assert resumed.id == application.id
    assert application_document_service.get_next_document_request(db, resumed.id).requirement.document_type == "OTHER"


def test_saved_document_reuse_is_owned_unambiguous_and_idempotent(
    db: Session,
) -> None:
    application = complete_pm_kisan_field(db)
    incompatible = owned_document(db, application, DocumentType.INCOME_CERTIFICATE, "Income")
    compatible = owned_document(db, application, "DRIVING_LICENCE", "Licence")
    # A sole compatible My Documents item is reused before the Assistant can
    # render a request. An incompatible saved item remains unused.
    progress = application_progress.get_application_progress(db, application.id)
    assert progress.documents.satisfied[0].document_id == compatible.id
    assert application_document_service.get_next_document_request(db, application.id).requirement.document_type == "OTHER"
    assert db.scalar(
        select(func.count()).select_from(ApplicationDocument).where(
            ApplicationDocument.application_id == application.id,
            ApplicationDocument.document_id == compatible.id,
        )
    ) == 1

    # Recalculating progress must not add a duplicate attachment.
    application_progress.get_application_progress(db, application.id)
    assert db.scalar(
        select(func.count()).select_from(ApplicationDocument).where(
            ApplicationDocument.application_id == application.id,
            ApplicationDocument.document_id == compatible.id,
        )
    ) == 1

    request = application_document_service.get_next_document_request(db, application.id)

    other_service_requirement = db.scalar(
        select(ServiceDocumentRequirement)
        .where(ServiceDocumentRequirement.service_id == "SCHOLARSHIP_001")
        .limit(1)
    )
    other = User(email="foreign-owner@example.test", auth_state="DEMO")
    db.add(other)
    db.flush()
    foreign_document = Document(
        user_id=other.id,
        name="Foreign licence",
        document_type="DRIVING_LICENCE",
        source=DocumentSource.PROFILE_UPLOAD,
    )
    db.add(foreign_document)
    foreign_application = Application(
        user_id=other.id,
        service_id=application.service_id,
        status=ApplicationStatus.CONSENT_REQUIRED,
    )
    db.add(foreign_application)
    db.commit()

    cases = [
        (request.requirement.id, incompatible.id, 422, "INCOMPATIBLE_DOCUMENT"),
        (request.requirement.id, foreign_document.id, 404, "DOCUMENT_NOT_FOUND"),
        (other_service_requirement.id, compatible.id, 422, "APPLICATION_REQUIREMENT_NOT_FOUND"),
        ("not-a-requirement", compatible.id, 422, "APPLICATION_REQUIREMENT_NOT_FOUND"),
    ]
    for requirement_id, document_id, status_code, code in cases:
        with pytest.raises(HTTPException) as error:
            attach_document_action(
                ApplicationDocumentActionRequest(
                    application_id=application.id,
                    requirement_id=requirement_id,
                    document_id=document_id,
                ),
                db,
            )
        assert error.value.status_code == status_code
        assert error.value.detail["code"] == code

    with pytest.raises(HTTPException) as foreign_error:
        attach_document_action(
            ApplicationDocumentActionRequest(
                application_id=foreign_application.id,
                requirement_id=request.requirement.id,
                document_id=compatible.id,
            ),
            db,
        )
    assert foreign_error.value.status_code == 404
    assert foreign_error.value.detail["code"] == "APPLICATION_NOT_FOUND"


def test_optional_and_terminal_requirements_are_not_mutable(db: Session) -> None:
    application = complete_pm_kisan_field(db)
    optional = ServiceDocumentRequirement(
        service_id=application.service_id,
        document_type="IDENTITY_DOCUMENT",
        label="Optional identity copy",
        required=False,
        position=99,
    )
    db.add(optional)
    db.commit()
    document = owned_document(db, application, "DRIVING_LICENCE", "Licence")
    with pytest.raises(application_document_service.ApplicationDocumentRequirementNotApplicableError):
        application_document_service.attach_document(
            db, application.id, optional.id, document.id
        )

    loaded = application_engine.get_application(db, application.id)
    loaded.status = ApplicationStatus.SUBMITTED
    db.commit()
    with pytest.raises(application_engine.ApplicationNotEditableError):
        application_document_service.attach_document(
            db,
            application.id,
            application.service.document_requirements[0].id,
            document.id,
        )


def test_manual_pdf_and_image_uploads_persist_attach_and_refresh_progress(db: Session) -> None:
    application = complete_pm_kisan_field(db)
    identity = application_document_service.get_next_document_request(db, application.id)
    first = asyncio.run(
        upload_document_action(
            application_id=application.id,
            requirement_id=identity.requirement.id,
            file=upload("identity.pdf", "application/pdf", b"%PDF-1.4 synthetic"),
            db=db,
        )
    )
    assert first.attached_document.document_type == "IDENTITY_DOCUMENT"
    assert first.next_document is not None
    assert first.next_document.requirement.document_type == "OTHER"

    second = asyncio.run(
        upload_document_action(
            application_id=application.id,
            requirement_id=first.next_document.requirement.id,
            file=upload("land.png", "image/png", b"\x89PNG\r\n\x1a\n synthetic"),
            db=db,
        )
    )
    assert second.progress.documents.missing == []
    assert second.next_document is None
    assert len(second.progress.documents.satisfied) == 2
    persisted = list(
        db.scalars(
            select(Document).where(
                Document.id.in_(
                    [first.attached_document.document_id, second.attached_document.document_id]
                )
            )
        ).all()
    )
    assert len(persisted) == 2
    assert all(document.source == DocumentSource.PROFILE_UPLOAD for document in persisted)
    assert all(document.id in {item.id for item in profile_service.list_documents(db)} for document in persisted)


def test_shared_upload_service_preserves_normal_form_out_of_order_uploads(db: Session) -> None:
    application = complete_pm_kisan_field(db)
    supporting = next(
        requirement
        for requirement in application.service.document_requirements
        if requirement.document_type == "OTHER"
    )
    document = asyncio.run(
        application_document_service.upload_and_attach_document(
            db,
            application.id,
            supporting.id,
            upload("land.pdf", "application/pdf", b"%PDF-1.4 synthetic land record"),
        )
    )
    progress = application_progress.get_application_progress(db, application.id)
    assert document.id in {item.document_id for item in progress.documents.satisfied}
    assert progress.documents.missing[0].document_type == "IDENTITY_DOCUMENT"
    assert application_document_service.get_next_document_request(db, application.id).requirement.document_type == "IDENTITY_DOCUMENT"


@pytest.mark.parametrize(
    ("filename", "content_type", "content", "code"),
    [
        ("identity.exe", "application/octet-stream", b"unsafe", "UNSUPPORTED_FILE_TYPE"),
        ("identity.pdf", "application/pdf", b"", "EMPTY_FILE"),
        ("identity.pdf", "image/png", b"%PDF-1.4", "UNSUPPORTED_FILE_TYPE"),
        ("identity.pdf", "application/pdf", b"not really a PDF", "INVALID_FILE_CONTENT"),
        ("identity.pdf", "application/pdf", b"OVERSIZED", "FILE_TOO_LARGE"),
    ],
)
def test_manual_upload_validation_leaves_no_document_or_attachment(
    db: Session, filename: str, content_type: str, content: bytes, code: str
) -> None:
    application = complete_pm_kisan_field(db)
    request = application_document_service.get_next_document_request(db, application.id)
    before_documents = db.scalar(select(func.count()).select_from(Document))
    if code == "FILE_TOO_LARGE":
        content = b"x" * (profile_service.MAX_UPLOAD_BYTES + 1)
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            upload_document_action(
                application_id=application.id,
                requirement_id=request.requirement.id,
                file=upload(filename, content_type, content),
                db=db,
            )
        )
    assert error.value.detail["code"] == code
    assert db.scalar(select(func.count()).select_from(Document)) == before_documents
    assert db.scalar(select(func.count()).select_from(ApplicationDocument)) == 0


def test_digilocker_import_filters_reuses_and_attaches_without_my_documents_pollution(
    db: Session,
) -> None:
    application = application_engine.create_application(db, "NATIONAL_SCHOLARSHIP_001")
    application_engine.set_application_field(db, application.id, "course", "Engineering")
    application_engine.set_application_field(db, application.id, "academic_year", "2026-27")
    request = application_document_service.get_next_document_request(db, application.id)
    assert request.requirement.document_type == "INCOME_CERTIFICATE"
    assert [item.document_id for item in request.digilocker_options] == ["mock-income"]

    payload = ApplicationDocumentActionRequest(
        application_id=application.id,
        requirement_id=request.requirement.id,
        document_id="mock-income",
    )
    first = import_digilocker_action(payload, db)
    second = import_digilocker_action(payload, db)
    assert first.next_document.requirement.document_type == "MARKSHEET"
    assert second.attached_document.document_id == first.attached_document.document_id
    assert db.scalar(
        select(func.count()).select_from(Document).where(
            Document.storage_key == "mock-digilocker/mock-income"
        )
    ) == 1
    imported = db.get(Document, first.attached_document.document_id)
    assert imported is not None and imported.user_id == application.user_id
    assert imported.source == DocumentSource.DIGILOCKER
    assert first.attached_document.document_id not in {
        document.id for document in profile_service.list_documents(db)
    }


def test_digilocker_rejects_incompatible_unknown_and_user_unavailable_documents(db: Session) -> None:
    application = complete_pm_kisan_field(db)
    request = application_document_service.get_next_document_request(db, application.id)
    for document_id, code in [("mock-income", "INCOMPATIBLE_DOCUMENT"), ("missing", "DIGILOCKER_DOCUMENT_NOT_FOUND")]:
        with pytest.raises(HTTPException) as error:
            import_digilocker_action(
                ApplicationDocumentActionRequest(
                    application_id=application.id,
                    requirement_id=request.requirement.id,
                    document_id=document_id,
                ),
                db,
            )
        assert error.value.detail["code"] == code

    class RestrictedProvider:
        document = ProviderDocument("private", "Private ID", "DRIVING_LICENCE", "Issuer")

        def get_documents(self, user_id: str):
            return [self.document] if user_id == "allowed-user" else []

        def get_document(self, document_id: str):
            return self.document

        def request_consent(self, user_id: str, document_ids: list[str]):
            return ProviderConsent(user_id, document_ids, "GRANTED")

    with pytest.raises(Exception) as unavailable:
        digilocker_service.import_and_attach_document(
            db,
            application.id,
            request.requirement.id,
            "private",
            provider=RestrictedProvider(),
        )
    assert type(unavailable.value).__name__ == "ProviderDocumentNotFoundError"


def test_chat_tool_registry_is_narrow_and_orchestration_emits_document_request(db: Session) -> None:
    tools = {tool["name"]: tool for tool in TOOLS}
    for name in (
        "list_available_documents",
        "attach_document",
        "import_and_attach_digilocker_document",
    ):
        assert name in tools
        assert "user_id" not in tools[name]["parameters"]["properties"]

    class DocumentProvider:
        def __init__(self):
            self.step = 0
            self.application_id = None

        def respond(self, items):
            self.step += 1
            if self.step == 1:
                return SimpleNamespace(
                    output=[SimpleNamespace(
                        type="function_call",
                        name="create_or_resume_application",
                        arguments='{"service_id":"PM_KISAN_001"}',
                        call_id="create",
                    )],
                    output_text="",
                )
            created = next(
                item for item in reversed(items)
                if isinstance(item, dict) and item.get("call_id") == "create"
            )
            self.application_id = json.loads(created["output"])["application_id"]
            if self.step == 2:
                return SimpleNamespace(
                    output=[SimpleNamespace(
                        type="function_call",
                        name="set_application_field",
                        arguments=json.dumps({
                            "application_id": self.application_id,
                            "field_key": "farmer_declaration",
                            "value": True,
                        }),
                        call_id="field",
                    )],
                    output_text="",
                )
            return SimpleNamespace(output=[], output_text="Additional information saved.")

    provider = DocumentProvider()
    response = chat(db, ChatRequest(message="Apply for PM-KISAN"), provider)
    request = next(component for component in response.components if component.type == "DOCUMENT_REQUEST")
    assert request.application_id == provider.application_id
    assert request.requirement.document_type == "IDENTITY_DOCUMENT"
    assert any(component.type == "APPLICATION_PROGRESS" for component in response.components)


@pytest.mark.parametrize(
    ("service_id", "answers", "expected_document_types"),
    [
        ("KA_INCOME_CERTIFICATE_001", {"certificate_purpose": "Scholarship"}, ["IDENTITY_DOCUMENT", "OTHER"]),
        ("KA_CASTE_CERTIFICATE_001", {"certificate_purpose": "Education"}, ["IDENTITY_DOCUMENT", "OTHER"]),
        ("JEE_MAIN_001", {"exam_city": "Bengaluru", "paper_preference": "Paper 1"}, ["SIGNATURE", "MARKSHEET"]),
    ],
)
def test_representative_service_document_loops_persist_across_resume(
    db: Session,
    service_id: str,
    answers: dict[str, object],
    expected_document_types: list[str],
) -> None:
    if service_id.startswith("KA_"):
        profile = db.scalar(select(Profile))
        permanent = next(
            address for address in profile.addresses if address.type == AddressType.PERMANENT
        )
        permanent.state = "Karnataka"
        db.commit()
    _, created = application_engine.create_or_resume_application(db, service_id)
    for field_key, value in answers.items():
        application_engine.set_application_field(db, created.id, field_key, value)

    seen: list[str] = []
    while request := application_document_service.get_next_document_request(db, created.id):
        seen.append(request.requirement.document_type)
        extension = "png" if request.requirement.document_type == "SIGNATURE" else "pdf"
        mime = "image/png" if extension == "png" else "application/pdf"
        content = b"\x89PNG\r\n\x1a\n synthetic" if extension == "png" else b"%PDF-1.4 synthetic"
        asyncio.run(
            application_document_service.upload_and_attach_document(
                db,
                created.id,
                request.requirement.id,
                upload(f"document.{extension}", mime, content),
                require_current=True,
            )
        )

    assert seen == expected_document_types
    assert application_progress.get_application_progress(db, created.id).documents.missing == []
    result, resumed = application_engine.create_or_resume_application(db, service_id)
    assert result == "RESUMED" and resumed.id == created.id
    assert application_progress.get_application_progress(db, resumed.id).documents.missing == []
