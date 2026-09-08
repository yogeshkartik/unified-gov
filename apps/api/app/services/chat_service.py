"""Narrow, extensible tool layer for the citizen assistant."""
from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.service import Service, ServiceStatus
from app.schemas.chat import ChatRequest, ChatResponse, ChatServiceCard
from app.services import service_catalog

logger = logging.getLogger(__name__)

SYSTEM_INSTRUCTIONS = """You are the citizen assistant for this government-service portal. Help users discover and understand services using only tool results. Never invent a service or portal requirement. Use search_services for service questions and get_service_details for explanations. If no result is available, say it is not currently available in this portal. Do not claim an application was created, updated, paid, consented, or submitted: those capabilities are unavailable. Respond in the user's language when practical."""

TOOLS = [
    {"type": "function", "name": "search_services", "description": "Find active citizen-facing portal services.", "parameters": {"type": "object", "properties": {"query": {"type": "string"}, "state_code": {"type": "string"}, "category": {"type": "string"}}, "required": ["query"], "additionalProperties": False}},
    {"type": "function", "name": "get_service_details", "description": "Get canonical details for a service ID returned by search_services.", "parameters": {"type": "object", "properties": {"service_id": {"type": "string"}}, "required": ["service_id"], "additionalProperties": False}},
]

class ChatProviderError(Exception): pass

class OpenAIChatProvider:
    def respond(self, input_items: list[dict[str, Any]]) -> Any:
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

def _tool_result(db: Session, name: str, arguments: dict[str, Any], selected: dict[str, Service]) -> dict[str, Any]:
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
    return {"error": "UNKNOWN_TOOL"}

def _output_text(response: Any) -> str:
    return str(getattr(response, "output_text", "")).strip()

def chat(db: Session, request: ChatRequest, provider: OpenAIChatProvider | None = None) -> ChatResponse:
    provider = provider or OpenAIChatProvider()
    items: list[dict[str, Any]] = [{"role": message.role, "content": message.content} for message in request.history[-12:]]
    items.append({"role": "user", "content": f"[UI locale: {request.locale}] {request.message}"})
    selected: dict[str, Service] = {}
    try:
        for _ in range(4):
            response = provider.respond(items)
            calls = [item for item in getattr(response, "output", []) if getattr(item, "type", None) == "function_call"]
            if not calls:
                text = _output_text(response) or "I couldn't find that service in the services currently available in this portal."
                return ChatResponse(message=text, components=[_service_card(service) for service in list(selected.values())[:4]])
            # Preserve the model's call items with the matching call outputs for the next Responses API turn.
            items.extend(getattr(response, "output", []))
            for call in calls:
                try: arguments = json.loads(getattr(call, "arguments", "{}"))
                except json.JSONDecodeError: arguments = {}
                result = _tool_result(db, getattr(call, "name", ""), arguments, selected)
                items.append({"type": "function_call_output", "call_id": getattr(call, "call_id", ""), "output": json.dumps(result)})
        raise ChatProviderError("Tool loop limit")
    except ChatProviderError:
        raise
    except Exception as error:
        logger.warning("Citizen assistant request failed: %s", type(error).__name__)
        raise ChatProviderError("Chat failed") from error
