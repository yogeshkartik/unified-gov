"""Narrow, extensible tool layer for the citizen assistant."""
from __future__ import annotations

import json
import logging
from time import perf_counter
from types import SimpleNamespace
from typing import Any, Protocol
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.service import Service, ServiceStatus
from app.schemas.chat import ChatRequest, ChatResponse, ChatServiceCard
from app.schemas.application_review import ApplicationReview, ConsentCard
from app.schemas.chat_transaction import PaymentCard, SubmissionConfirmation, SubmissionSuccess
from app.schemas.application_progress import ApplicationProgress, ApplicationQuestion, DocumentRequest, ProfileToolResult
from app.models.profile import AddressType
from app.services import application_document_service, application_engine, application_progress, application_review_service, chat_transaction_service, digilocker_service, profile_service, service_catalog
from app.integrations.digilocker.mock import ProviderDocumentNotFoundError
from app.services.recommendations import permanent_state_code

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTIONS = """You are a helpful, citizen-friendly assistant for this government-service portal. Use backend tools for every portal fact: services, jurisdiction, fees, requirements, profile availability, and application progress. Backend results are authoritative; never infer or invent them.

For a normal question about a service, scheme, certificate, examination, scholarship, licence, or portal service, usually write two short plain-text paragraphs (about 60–120 words when the question warrants it). Give a brief explanation of what the service is, directly answer the citizen's actual question using authoritative information, and give a useful next step when appropriate. Do not mechanically include every part when it is unnecessary. Prioritize the actual question over general background.

For “what is” questions, focus on the purpose and intended citizens. For “how do I apply” questions, give one sentence of context, note any known jurisdiction or eligibility consideration, and explain how to proceed. For eligibility questions, give brief context, a clear answer based only on authoritative data, and a next step; if required facts are unavailable, say so or ask one concise question. Do not invent eligibility, age or education rules, fees, documents, processing times, benefits, deadlines, authorities, or jurisdiction rules.

Do not become an encyclopedia: do not add history, exhaustive rules, or long lists unless requested. The UI cards already present structured service details, so use conversational text to explain rather than repeat every fee, document, field, authority, or eligibility condition. Use simple, natural language and clean paragraphs; do not use Markdown headings, tables, or decorative formatting.

During an active application, keep responses fast and conversational: use only one to three sentences to state progress and the next required item. Keep greetings to one sentence, simple follow-ups to one to three sentences, errors to one or two sentences, and submission success to a short confirmation with the important reference or status.

For state-specific services such as income, caste, domicile, or state certificates, call search_services directly. It automatically applies the authenticated citizen's permanent-state jurisdiction when the citizen did not name a state. Do not list every state's variant; ask one concise clarification only when the returned results do not identify a relevant service.

Respond in the selected UI language when practical; do not translate IDs, reference numbers, filenames, canonical values, or citizen-entered values.

Create or resume an application only when the citizen explicitly asks to apply. Save fields only with set_application_field. Attach documents only through document tools and canonical IDs. Final review comes only from get_application_review. Never request or send document bytes, full review personal data, payment transaction data, or submission snapshots.

Ordinary messages such as yes, continue, pay, or submit never grant consent, process payment, or submit an application. Those actions are available only through explicit structured UI controls and are not tools. Do not claim profile data changed, consent, payment, or submission succeeded unless an authoritative backend result says so."""

TOOLS = [
    {"type": "function", "name": "search_services", "description": "Find active canonical portal services. When state_code is omitted, the backend automatically applies the authenticated citizen's permanent-state jurisdiction for state services; do not guess or request profile data just for routine service discovery.", "parameters": {"type": "object", "properties": {"query": {"type": "string"}, "state_code": {"type": "string"}, "category": {"type": "string"}}, "required": ["query"], "additionalProperties": False}},
    {"type": "function", "name": "get_service_details", "description": "Get canonical details for a service ID returned by search_services.", "parameters": {"type": "object", "properties": {"service_id": {"type": "string"}}, "required": ["service_id"], "additionalProperties": False}},
    {"type": "function", "name": "get_my_profile", "description": "Get minimized profile availability and permanent-state jurisdiction. Call before searching state-specific services when the citizen did not state a jurisdiction.", "parameters": {"type": "object", "properties": {}, "additionalProperties": False}},
    {"type": "function", "name": "create_or_resume_application", "description": "Create or resume the authenticated citizen's normal application for an active canonical service.", "parameters": {"type": "object", "properties": {"service_id": {"type": "string"}}, "required": ["service_id"], "additionalProperties": False}},
    {"type": "function", "name": "get_application_progress", "description": "Get authoritative progress for an application owned by the authenticated citizen.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}}, "required": ["application_id"], "additionalProperties": False}},
    {"type": "function", "name": "set_application_field", "description": "Validate and save one canonical active service field for an editable application owned by the authenticated citizen.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}, "field_key": {"type": "string"}, "value": {}}, "required": ["application_id", "field_key", "value"], "additionalProperties": False}},
    {"type": "function", "name": "list_available_documents", "description": "Get the first canonical missing document requirement and only compatible My Documents and DigiLocker choices for an application owned by the authenticated citizen.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}}, "required": ["application_id"], "additionalProperties": False}},
    {"type": "function", "name": "attach_document", "description": "Attach one compatible owned My Documents item to the current canonical application requirement.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}, "requirement_id": {"type": "string"}, "document_id": {"type": "string"}}, "required": ["application_id", "requirement_id", "document_id"], "additionalProperties": False}},
    {"type": "function", "name": "import_and_attach_digilocker_document", "description": "Import or reuse one compatible mock DigiLocker document and attach it to the current canonical application requirement.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}, "requirement_id": {"type": "string"}, "document_id": {"type": "string"}}, "required": ["application_id", "requirement_id", "document_id"], "additionalProperties": False}},
    {"type": "function", "name": "get_application_review", "description": "Make the authenticated citizen's authoritative final review available as a direct UI card. Personal review values are not returned to the model.", "parameters": {"type": "object", "properties": {"application_id": {"type": "string"}}, "required": ["application_id"], "additionalProperties": False}},
]

class ChatProviderError(Exception): pass


class ChatRateLimitError(ChatProviderError): pass


def _is_rate_limit_error(error: Exception) -> bool:
    return (
        type(error).__name__ in {"RateLimitError", "ResourceExhausted"}
        or getattr(error, "status_code", None) == 429
        or getattr(error, "code", None) == 429
    )


class ChatProvider(Protocol):
    def respond(self, input_items: list[Any]) -> Any: ...


class OpenAIChatProvider:
    def respond(self, input_items: list[Any]) -> Any:
        if not settings.openai_api_key:
            raise ChatProviderError("Provider is not configured")
        try:
            from openai import OpenAI
            return OpenAI(api_key=settings.openai_api_key).responses.create(model=settings.openai_chat_model, instructions=SYSTEM_INSTRUCTIONS, input=input_items, tools=TOOLS)
        except Exception as error:
            logger.warning("Citizen assistant provider request failed: %s", type(error).__name__)
            if _is_rate_limit_error(error):
                raise ChatRateLimitError("Provider rate limit") from error
            raise ChatProviderError("Provider request failed") from error


class GeminiChatProvider:
    """Google AI Studio Interactions API adapter for the narrow tool contract."""

    def __init__(self, client: Any | None = None) -> None:
        self._client = client
        self._initial_input: str | None = None
        self._previous_interaction_id: str | None = None
        self._pending_tool_results: list[dict[str, Any]] | None = None

    def _ensure_client(self) -> None:
        if not settings.gemini_api_key:
            raise ChatProviderError("Gemini provider is not configured")
        if self._client is not None:
            return
        try:
            from google import genai

            self._client = genai.Client(api_key=settings.gemini_api_key)
        except ImportError as error:
            logger.warning("Gemini SDK is unavailable: %s", type(error).__name__)
            raise ChatProviderError("Gemini SDK is unavailable") from error

    @staticmethod
    def _history_input(input_items: list[Any]) -> str:
        """Keep the existing bounded, caller-supplied history in one text input."""
        lines: list[str] = []
        for item in input_items:
            if not isinstance(item, dict) or item.get("role") not in {"user", "assistant"}:
                continue
            role = "Assistant" if item["role"] == "assistant" else "Citizen"
            lines.append(f"{role}: {item.get('content', '')}")
        return "\n".join(lines)

    def respond(self, input_items: list[Any]) -> Any:
        self._ensure_client()
        assert self._client is not None
        if self._initial_input is None:
            self._initial_input = self._history_input(input_items)
        input_data: str | list[dict[str, Any]]
        input_data = self._pending_tool_results if self._pending_tool_results is not None else self._initial_input
        request: dict[str, Any] = {
            "model": settings.gemini_model,
            "input": input_data,
            "tools": TOOLS,
            "system_instruction": SYSTEM_INSTRUCTIONS,
            "generation_config": {"thinking_level": settings.gemini_thinking_level},
        }
        if self._previous_interaction_id:
            request["previous_interaction_id"] = self._previous_interaction_id
        try:
            raw_response = self._client.interactions.create(**request)
        except Exception as error:
            logger.warning("Gemini provider request failed: %s", type(error).__name__)
            if _is_rate_limit_error(error):
                raise ChatRateLimitError("Gemini rate limit") from error
            raise ChatProviderError("Gemini provider request failed") from error

        calls = [
            SimpleNamespace(
                type="function_call",
                name=step.name,
                arguments=json.dumps(getattr(step, "arguments", {}) or {}),
                call_id=getattr(step, "id", f"gemini-{index}"),
            )
            for index, step in enumerate(getattr(raw_response, "steps", None) or [])
            if getattr(step, "type", None) == "function_call"
        ]
        return SimpleNamespace(output=calls, output_text=getattr(raw_response, "output_text", ""), raw_response=raw_response)

    def submit_tool_results(self, response: Any, results: list[tuple[Any, dict[str, Any]]]) -> None:
        """Continue the interaction with safely serialized local tool results."""
        interaction_id = getattr(response.raw_response, "id", None)
        if not interaction_id:
            raise ChatProviderError("Gemini interaction did not include an ID")
        self._previous_interaction_id = interaction_id
        self._pending_tool_results = [
            {
                "type": "function_result",
                "name": call.name,
                "call_id": call.call_id,
                "result": [{"type": "text", "text": json.dumps(result)}],
            }
            for call, result in results
        ]


def create_chat_provider() -> ChatProvider:
    provider = settings.llm_provider.strip().lower()
    if provider == "openai":
        return OpenAIChatProvider()
    if provider == "gemini":
        return GeminiChatProvider()
    logger.warning("Unsupported LLM provider configured: %s", provider or "<empty>")
    raise ChatProviderError("Unsupported LLM provider")

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


def _model_progress(progress: ApplicationProgress) -> dict[str, Any]:
    """Return only orchestration state; complete values stay in UI-only cards."""
    return {
        "application_id": progress.application_id,
        "status": progress.status,
        "next_stage": progress.next_stage,
        "missing_profile_fields": progress.profile.missing,
        "missing_application_field_keys": [field.key for field in progress.application_fields.missing],
        "missing_document_types": [document.document_type for document in progress.documents.missing],
        "consent_granted": progress.consent.granted,
        "payment_required": progress.payment.required,
        "payment_status": progress.payment.status,
        "ready_for_review": progress.ready_for_review,
        "ready_for_submission": progress.ready_for_submission,
    }


def _tool_result(
    db: Session,
    name: str,
    arguments: dict[str, Any],
    selected: dict[str, Service],
    progresses: dict[str, ApplicationProgress] | None = None,
    questions: dict[str, ApplicationQuestion] | None = None,
    document_requests: dict[str, DocumentRequest] | None = None,
    reviews: dict[str, tuple[ApplicationReview, ConsentCard | None]] | None = None,
) -> dict[str, Any]:
    progresses = progresses if progresses is not None else {}
    questions = questions if questions is not None else {}
    document_requests = document_requests if document_requests is not None else {}
    reviews = reviews if reviews is not None else {}
    if name == "search_services":
        state_code = arguments.get("state_code")
        if not state_code:
            # The authenticated profile is available to the backend without a
            # separate model tool turn. It is only used to constrain canonical
            # catalog results and is never returned from this tool.
            try:
                state_code = get_my_profile(db).permanent_state_code
            except profile_service.ProfileNotFoundError:
                state_code = None
        services = service_catalog.search_services(db, str(arguments.get("query", "")), state_code, arguments.get("category"))
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
            return {"result": result, "application_id": application.id, "progress": _model_progress(progress), "next_question": question.model_dump() if question else None, "next_document": document_request.model_dump() if document_request else None}
        except service_catalog.ServiceNotFoundError: return {"error": "SERVICE_NOT_FOUND"}
        except application_engine.ServiceNotAvailableError: return {"error": "SERVICE_NOT_AVAILABLE"}
        except application_engine.ServiceJurisdictionError: return {"error": "SERVICE_JURISDICTION_MISMATCH"}
    if name == "get_application_progress":
        try:
            progress, question, document_request = _record_application_state(
                db, str(arguments.get("application_id", "")), progresses, questions, document_requests
            )
            return {"progress": _model_progress(progress), "next_question": question.model_dump() if question else None, "next_document": document_request.model_dump() if document_request else None}
        except application_engine.ApplicationNotFoundError: return {"error": "APPLICATION_NOT_FOUND"}
    if name == "set_application_field":
        try:
            _value, application = application_engine.set_application_field(
                db, str(arguments.get("application_id", "")), str(arguments.get("field_key", "")), arguments.get("value")
            )
            progress, question, document_request = _record_application_state(
                db, application.id, progresses, questions, document_requests
            )
            return {"saved_field_key": arguments.get("field_key"), "progress": _model_progress(progress), "next_question": question.model_dump() if question else None, "next_document": document_request.model_dump() if document_request else None}
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
                "progress": _model_progress(progress),
                "next_document": document_request.model_dump() if document_request else None,
            }
        except application_engine.ApplicationNotFoundError: return {"error": "APPLICATION_NOT_FOUND"}
        except application_document_service.ApplicationDocumentNotFoundError: return {"error": "DOCUMENT_NOT_FOUND"}
        except ProviderDocumentNotFoundError: return {"error": "DIGILOCKER_DOCUMENT_NOT_FOUND"}
        except application_document_service.ApplicationDocumentRequirementNotFoundError: return {"error": "APPLICATION_REQUIREMENT_NOT_FOUND"}
        except application_document_service.ApplicationDocumentRequirementNotApplicableError: return {"error": "DOCUMENT_REQUIREMENT_NOT_APPLICABLE"}
        except application_document_service.IncompatibleApplicationDocumentError: return {"error": "INCOMPATIBLE_DOCUMENT"}
        except application_engine.ApplicationNotEditableError: return {"error": "APPLICATION_NOT_EDITABLE"}
    if name == "get_application_review":
        application_id = str(arguments.get("application_id", ""))
        try:
            result = application_review_service.get_application_review(db, application_id)
            reviews[application_id] = (result.review, result.consent_card)
            # Deliberately keep personal values out of model context. The full
            # authoritative cards travel directly from this process to the UI.
            return {
                "review_available": True,
                "application_id": application_id,
                "consent_status": result.review.consent.status,
                "payment_required": result.review.payment.required,
            }
        except application_engine.ApplicationNotFoundError:
            return {"error": "APPLICATION_NOT_FOUND"}
        except application_review_service.ApplicationNotReadyForReviewError as error:
            return {
                "error": "APPLICATION_INCOMPLETE",
                "missing_profile_fields": error.missing_profile_fields,
                "missing_documents": error.missing_documents,
                "missing_fields": error.missing_fields,
            }
        except application_review_service.ApplicationReviewUnavailableError:
            return {"error": "APPLICATION_REVIEW_UNAVAILABLE"}
    return {"error": "UNKNOWN_TOOL"}

def _output_text(response: Any) -> str:
    return str(getattr(response, "output_text", "")).strip()


READ_ONLY_TOOLS = frozenset({
    "search_services",
    "get_service_details",
    "get_my_profile",
    "get_application_progress",
    "list_available_documents",
    "get_application_review",
})


def chat(db: Session, request: ChatRequest, provider: ChatProvider | None = None) -> ChatResponse:
    provider = provider or create_chat_provider()
    request_id = uuid4().hex[:8]
    started_at = perf_counter()
    interaction_count = 0
    tool_count = 0
    memoized_results: dict[tuple[str, str], dict[str, Any]] = {}
    items: list[Any] = [{"role": message.role, "content": message.content} for message in request.history[-12:]]
    active_context = f" [Active application ID: {request.active_application_id}]" if request.active_application_id else ""
    items.append({"role": "user", "content": f"[UI locale: {request.locale}]{active_context} {request.message}"})
    selected: dict[str, Service] = {}
    progresses: dict[str, ApplicationProgress] = {}
    questions: dict[str, ApplicationQuestion] = {}
    document_requests: dict[str, DocumentRequest] = {}
    reviews: dict[str, tuple[ApplicationReview, ConsentCard | None]] = {}
    try:
        for _ in range(6):
            interaction_started_at = perf_counter()
            response = provider.respond(items)
            interaction_count += 1
            logger.debug(
                "[chat %s] interaction=%s duration_ms=%d",
                request_id, interaction_count, (perf_counter() - interaction_started_at) * 1000,
            )
            calls = [item for item in getattr(response, "output", []) if getattr(item, "type", None) == "function_call"]
            if not calls:
                text = _output_text(response) or "I couldn't find that service in the services currently available in this portal."
                review_components: list[ApplicationReview | ConsentCard] = []
                if reviews:
                    review, consent_card = list(reviews.values())[-1]
                    review_components = [review, *([consent_card] if consent_card else [])]
                transaction_components: list[PaymentCard | SubmissionConfirmation | SubmissionSuccess] = []
                if progresses:
                    progress = list(progresses.values())[-1]
                    transaction = chat_transaction_service.get_transaction_components(
                        db, progress.application_id
                    )
                    transaction_components = [
                        *([transaction.payment_card] if transaction.payment_card else []),
                        *([transaction.submission_confirmation] if transaction.submission_confirmation else []),
                        *([transaction.submission_success] if transaction.submission_success else []),
                    ]
                components = [*_service_card_list(selected), *list(progresses.values())[-1:], *list(questions.values())[-1:], *list(document_requests.values())[-1:], *review_components, *transaction_components]
                result = ChatResponse(message=text, components=components)
                logger.debug(
                    "[chat %s] total_ms=%d interactions=%s tool_calls=%s outcome=success",
                    request_id, (perf_counter() - started_at) * 1000, interaction_count, tool_count,
                )
                return result
            # The Responses API expects its original call item plus call outputs.
            # Gemini instead retains its own typed conversation and receives
            # function-response parts below.
            if not hasattr(provider, "submit_tool_results"):
                items.extend(getattr(response, "output", []))
            tool_results: list[tuple[Any, dict[str, Any]]] = []
            for call in calls:
                try: arguments = json.loads(getattr(call, "arguments", "{}"))
                except json.JSONDecodeError: arguments = {}
                if not isinstance(arguments, dict):
                    arguments = {}
                name = getattr(call, "name", "")
                cache_key = (name, json.dumps(arguments, sort_keys=True, default=str))
                tool_started_at = perf_counter()
                if name in READ_ONLY_TOOLS and cache_key in memoized_results:
                    result = memoized_results[cache_key]
                    cache_status = "cached"
                else:
                    result = _tool_result(db, name, arguments, selected, progresses, questions, document_requests, reviews)
                    if name in READ_ONLY_TOOLS:
                        memoized_results[cache_key] = result
                    cache_status = "executed"
                tool_count += 1
                logger.debug(
                    "[chat %s] tool=%s duration_ms=%d %s",
                    request_id, name, (perf_counter() - tool_started_at) * 1000, cache_status,
                )
                tool_results.append((call, result))
                if not hasattr(provider, "submit_tool_results"):
                    items.append({"type": "function_call_output", "call_id": getattr(call, "call_id", ""), "output": json.dumps(result)})
            submit_tool_results = getattr(provider, "submit_tool_results", None)
            if submit_tool_results:
                submit_tool_results(response, tool_results)
        raise ChatProviderError("Tool loop limit")
    except ChatProviderError as error:
        logger.debug(
            "[chat %s] total_ms=%d interactions=%s tool_calls=%s outcome=error category=%s",
            request_id, (perf_counter() - started_at) * 1000, interaction_count, tool_count, type(error).__name__,
        )
        raise
    except Exception as error:
        logger.debug(
            "[chat %s] total_ms=%d interactions=%s tool_calls=%s outcome=error category=%s",
            request_id, (perf_counter() - started_at) * 1000, interaction_count, tool_count, type(error).__name__,
        )
        logger.warning("Citizen assistant request failed: %s", type(error).__name__)
        raise ChatProviderError("Chat failed") from error


def _service_card_list(selected: dict[str, Service]) -> list[ChatServiceCard]:
    return [_service_card(service) for service in list(selected.values())[:4]]
