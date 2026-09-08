"""Narrow, extensible tool layer for the citizen assistant."""
from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.service import Service, ServiceStatus
from app.schemas.chat import ChatRequest, ChatResponse, ChatServiceCard
from app.schemas.application_progress import ApplicationProgress, ApplicationQuestion, DocumentRequest, ProfileToolResult
from app.models.profile import AddressType
from app.services import application_document_service, application_engine, application_progress, digilocker_service, profile_service, service_catalog
from app.integrations.digilocker.mock import ProviderDocumentNotFoundError
from app.services.recommendations import permanent_state_code

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTIONS = """You are the citizen assistant for this government-service portal. Use tools for portal services, citizen profile availability, and applications. The backend tool results are authoritative for requirements, questions, document compatibility, progress, ownership, and readiness; never calculate these from chat history or invent them. You may create or resume an application only when the user explicitly asks to apply. Application fields may be saved only through set_application_field. Documents may be attached only through the document tools using canonical IDs returned by list_available_documents. Success may be claimed only after a successful tool result. Never request or send document bytes to the model. Do not claim profile data was changed, consent was granted, payment was completed, or an application was submitted: those mutation capabilities are unavailable. Respond in the user's language when practical."""

TOOLS = [
    {"type": "function", "name": "search_services", "description": "Find active citizen-facing portal services.", "parameters": {"type": "object", "properties": {"query": {"type": "string"}, "state_code": {"type": "string"}, "category": {"type": "string"}}, "required": ["query"], "additionalProperties": False}},
    {"type": "function", "name": "get_service_details", "description": "Get canonical details for a service ID returned by search_services.", "parameters": {"type": "object", "properties": {"service_id": {"type": "string"}}, "required": ["service_id"], "additionalProperties": False}},
    {"type": "function", "name": "get_my_profile", "description": "Get minimized application-relevant availability for the authenticated citizen profile.", "parameters": {"type": "object", "properties": {}, "additionalProperties": False}},
    {"type": "function", "name": "create_or_resume_application", "description": "Create or resume the authenticated citizen's normal application for an active canonical service.", "parameters": {"type": "object", "properties": {"service_id": {"type": "string"}}, "required": ["service_id"], "additionalProperties": False}},
    {"type": "function", "name": "get_application_progress", "description": "Get authoritative progress for an application owned by the authenticated citizen.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}}, "required": ["application_id"], "additionalProperties": False}},
    {"type": "function", "name": "set_application_field", "description": "Validate and save one canonical active service field for an editable application owned by the authenticated citizen.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}, "field_key": {"type": "string"}, "value": {}}, "required": ["application_id", "field_key", "value"], "additionalProperties": False}},
    {"type": "function", "name": "list_available_documents", "description": "Get the first canonical missing document requirement and only compatible My Documents and DigiLocker choices for an application owned by the authenticated citizen.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}}, "required": ["application_id"], "additionalProperties": False}},
    {"type": "function", "name": "attach_document", "description": "Attach one compatible owned My Documents item to the current canonical application requirement.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}, "requirement_id": {"type": "string"}, "document_id": {"type": "string"}}, "required": ["application_id", "requirement_id", "document_id"], "additionalProperties": False}},
    {"type": "function", "name": "import_and_attach_digilocker_document", "description": "Import or reuse one compatible mock DigiLocker document and attach it to the current canonical application requirement.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}, "requirement_id": {"type": "string"}, "document_id": {"type": "string"}}, "required": ["application_id", "requirement_id", "document_id"], "additionalProperties": False}},
]

class ChatProviderError(Exception): pass

class OpenAIChatProvider:
    def respond(self, input_items: list[Any]) -> Any:
        if not settings.openai_api_key:
            raise ChatProviderError("Provider is not configured")
        try:
            from openai import OpenAI
            return OpenAI(api_key=settings.openai_api_key).responses.create(model=settings.openai_chat_model, instructions=SYSTEM_INSTRUCTIONS, input=input_items, tools=TOOLS)
        except Exception as error:
            logger.warning("Citizen assistant provider request failed: %s", type(error).__name__)
            raise ChatProviderError("Provider request failed") from error

def _service_card(service: Service) -> ChatServiceCard:
    return ChatServiceCard(service_id=service.id, name=service.name, description=service.description, department=service.department, category=service.category, government_level=str(service.government_level), jurisdiction_code=service.jurisdiction_code, fee=float(service.fee), currency=service.currency)


PROFILE_FIELDS = [
    "full_name", "date_of_birth", "gender", "nationality", "mobile", "email", "category",
    "disability_status", "highest_qualification", "current_education_status", "current_course",
    "current_institution", "employment_status", "occupation", "annual_family_income_range",
    "address", "education",
]


def get_my_profile(db: Session) -> ProfileToolResult:
    profile = profile_service.get_profile(db)
    available = [field for field in PROFILE_FIELDS if application_engine.has_profile_data(profile.user, field)]
    permanent = next((address for address in profile.addresses if address.type == AddressType.PERMANENT), None)
    return ProfileToolResult(
        permanent_state=permanent.state if permanent else None,
        permanent_state_code=permanent_state_code(profile),
        available_profile_fields=available,
        missing_profile_fields=[field for field in PROFILE_FIELDS if field not in available],
    )

def _record_application_state(
    db: Session,
    application_id: str,
    progresses: dict[str, ApplicationProgress],
    questions: dict[str, ApplicationQuestion],
    document_requests: dict[str, DocumentRequest],
) -> tuple[ApplicationProgress, ApplicationQuestion | None, DocumentRequest | None]:
    progress = application_progress.get_application_progress(db, application_id)
    question = application_progress.get_next_application_question(db, application_id)
    document_request = application_document_service.get_next_document_request(db, application_id)
    progresses[application_id] = progress
    if question:
        questions[application_id] = question
    else:
        questions.pop(application_id, None)
    if document_request:
        document_requests[application_id] = document_request
    else:
        document_requests.pop(application_id, None)
    return progress, question, document_request


def _tool_result(db: Session, name: str, arguments: dict[str, Any], selected: dict[str, Service], progresses: dict[str, ApplicationProgress] | None = None, questions: dict[str, ApplicationQuestion] | None = None, document_requests: dict[str, DocumentRequest] | None = None) -> dict[str, Any]:
    progresses = progresses if progresses is not None else {}
    questions = questions if questions is not None else {}
    document_requests = document_requests if document_requests is not None else {}
    if name == "search_services":
        services = service_catalog.search_services(db, str(arguments.get("query", "")), arguments.get("state_code"), arguments.get("category"))
        for service in services: selected[service.id] = service
        return {"services": [_service_card(service).model_dump() for service in services]}
    if name == "get_service_details":
        service_id = str(arguments.get("service_id", ""))
        # IDs are accepted only after a canonical lookup, never trusted model output.
        try: service = service_catalog.get_service(db, service_id)
        except service_catalog.ServiceNotFoundError: return {"error": "SERVICE_NOT_FOUND"}
        if service.status != ServiceStatus.OPEN: return {"error": "SERVICE_NOT_AVAILABLE"}
        selected[service.id] = service
        return {"service": _service_card(service).model_dump(), "instructions": service.instructions, "required_profile_fields": service.required_profile_fields, "fields": [{"label": field.label, "type": str(field.field_type), "required": field.required, "options": field.options} for field in service.fields], "required_documents": [document.label for document in service.document_requirements if document.required]}
    if name == "get_my_profile":
        return get_my_profile(db).model_dump()
    if name == "create_or_resume_application":
        service_id = str(arguments.get("service_id", ""))
        try:
            result, application = application_engine.create_or_resume_application(db, service_id)
            progress, question, document_request = _record_application_state(
                db, application.id, progresses, questions, document_requests
            )
            return {"result": result, "application_id": application.id, "progress": progress.model_dump(), "next_question": question.model_dump() if question else None, "next_document": document_request.model_dump() if document_request else None}
        except service_catalog.ServiceNotFoundError: return {"error": "SERVICE_NOT_FOUND"}
        except application_engine.ServiceNotAvailableError: return {"error": "SERVICE_NOT_AVAILABLE"}
        except application_engine.ServiceJurisdictionError: return {"error": "SERVICE_JURISDICTION_MISMATCH"}
    if name == "get_application_progress":
        try:
            progress, question, document_request = _record_application_state(
                db, str(arguments.get("application_id", "")), progresses, questions, document_requests
            )
            return {"progress": progress.model_dump(), "next_question": question.model_dump() if question else None, "next_document": document_request.model_dump() if document_request else None}
        except application_engine.ApplicationNotFoundError: return {"error": "APPLICATION_NOT_FOUND"}
    if name == "set_application_field":
        try:
            value, application = application_engine.set_application_field(
                db, str(arguments.get("application_id", "")), str(arguments.get("field_key", "")), arguments.get("value")
            )
            progress, question, document_request = _record_application_state(
                db, application.id, progresses, questions, document_requests
            )
            return {"saved_field_key": arguments.get("field_key"), "saved_value": value, "progress": progress.model_dump(), "next_question": question.model_dump() if question else None, "next_document": document_request.model_dump() if document_request else None}
        except application_engine.ApplicationNotFoundError: return {"error": "APPLICATION_NOT_FOUND"}
        except application_engine.ApplicationFieldNotFoundError: return {"error": "FIELD_NOT_FOUND"}
        except application_engine.ApplicationFieldNotApplicableError: return {"error": "FIELD_NOT_APPLICABLE"}
        except application_engine.ApplicationNotEditableError: return {"error": "APPLICATION_NOT_EDITABLE"}
        except application_engine.InvalidApplicationFieldsError: return {"error": "INVALID_APPLICATION_FIELD"}
    if name == "list_available_documents":
        try:
            document_request = application_document_service.get_next_document_request(
                db, str(arguments.get("application_id", ""))
            )
            if document_request:
                document_requests[document_request.application_id] = document_request
            return {"document_request": document_request.model_dump() if document_request else None}
        except application_engine.ApplicationNotFoundError: return {"error": "APPLICATION_NOT_FOUND"}
    if name in {"attach_document", "import_and_attach_digilocker_document"}:
        application_id = str(arguments.get("application_id", ""))
        requirement_id = str(arguments.get("requirement_id", ""))
        document_id = str(arguments.get("document_id", ""))
        try:
            if name == "attach_document":
                document = application_document_service.attach_document(
                    db, application_id, requirement_id, document_id
                )
            else:
                document = digilocker_service.import_and_attach_document(
                    db, application_id, requirement_id, document_id
                )
            progress, _, document_request = _record_application_state(
                db, application_id, progresses, questions, document_requests
            )
            return {
                "attached_document": application_document_service.document_choice(document).model_dump(),
                "progress": progress.model_dump(),
                "next_document": document_request.model_dump() if document_request else None,
            }
        except application_engine.ApplicationNotFoundError: return {"error": "APPLICATION_NOT_FOUND"}
        except application_document_service.ApplicationDocumentNotFoundError: return {"error": "DOCUMENT_NOT_FOUND"}
        except ProviderDocumentNotFoundError: return {"error": "DIGILOCKER_DOCUMENT_NOT_FOUND"}
        except application_document_service.ApplicationDocumentRequirementNotFoundError: return {"error": "APPLICATION_REQUIREMENT_NOT_FOUND"}
        except application_document_service.ApplicationDocumentRequirementNotApplicableError: return {"error": "DOCUMENT_REQUIREMENT_NOT_APPLICABLE"}
        except application_document_service.IncompatibleApplicationDocumentError: return {"error": "INCOMPATIBLE_DOCUMENT"}
        except application_engine.ApplicationNotEditableError: return {"error": "APPLICATION_NOT_EDITABLE"}
    return {"error": "UNKNOWN_TOOL"}

def _output_text(response: Any) -> str:
    return str(getattr(response, "output_text", "")).strip()

def chat(db: Session, request: ChatRequest, provider: OpenAIChatProvider | None = None) -> ChatResponse:
    provider = provider or OpenAIChatProvider()
    items: list[Any] = [{"role": message.role, "content": message.content} for message in request.history[-12:]]
    active_context = f" [Active application ID: {request.active_application_id}]" if request.active_application_id else ""
    items.append({"role": "user", "content": f"[UI locale: {request.locale}]{active_context} {request.message}"})
    selected: dict[str, Service] = {}
    progresses: dict[str, ApplicationProgress] = {}
    questions: dict[str, ApplicationQuestion] = {}
    document_requests: dict[str, DocumentRequest] = {}
    try:
        for _ in range(6):
            response = provider.respond(items)
            calls = [item for item in getattr(response, "output", []) if getattr(item, "type", None) == "function_call"]
            if not calls:
                text = _output_text(response) or "I couldn't find that service in the services currently available in this portal."
                components = [*_service_card_list(selected), *list(progresses.values())[-1:], *list(questions.values())[-1:], *list(document_requests.values())[-1:]]
                return ChatResponse(message=text, components=components)
            # Preserve the model's call items with the matching call outputs for the next Responses API turn.
            items.extend(getattr(response, "output", []))
            for call in calls:
                try: arguments = json.loads(getattr(call, "arguments", "{}"))
                except json.JSONDecodeError: arguments = {}
                result = _tool_result(db, getattr(call, "name", ""), arguments, selected, progresses, questions, document_requests)
                items.append({"type": "function_call_output", "call_id": getattr(call, "call_id", ""), "output": json.dumps(result)})
        raise ChatProviderError("Tool loop limit")
    except ChatProviderError:
        raise
    except Exception as error:
        logger.warning("Citizen assistant request failed: %s", type(error).__name__)
        raise ChatProviderError("Chat failed") from error


def _service_card_list(selected: dict[str, Service]) -> list[ChatServiceCard]:
    return [_service_card(service) for service in list(selected.values())[:4]]
