from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.schemas.chat import ChatRequest
from app.schemas.application_progress import (
    ApplicationFieldProgress,
    ApplicationProgress,
    ConsentProgress,
    DocumentProgress,
    PaymentProgress,
    ProfileProgress,
    ProgressField,
    ProgressService,
)
from app.services.chat_service import (
    ChatProviderError,
    GeminiChatProvider,
    OpenAIChatProvider,
    _model_progress,
    create_chat_provider,
    chat,
)
from app.services.seed import seed_demo_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'gemini-chat.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


class FakeGeminiInteractions:
    def __init__(self):
        self.requests = []
        self.step = 0

    def create(self, **kwargs):
        self.requests.append(kwargs)
        self.step += 1
        if self.step == 1:
            return SimpleNamespace(
                id="interaction-1",
                steps=[SimpleNamespace(type="function_call", id="call-search", name="search_services", arguments={"query": "PM-KISAN"})],
                output_text="",
            )
        return SimpleNamespace(id="interaction-2", steps=[], output_text="PM-KISAN is available.")


def test_provider_selector_supports_both_providers(monkeypatch) -> None:
    monkeypatch.setattr(settings, "llm_provider", "gemini")
    assert isinstance(create_chat_provider(), GeminiChatProvider)
    monkeypatch.setattr(settings, "llm_provider", "openai")
    assert isinstance(create_chat_provider(), OpenAIChatProvider)


def test_provider_selector_rejects_unknown_provider(monkeypatch) -> None:
    monkeypatch.setattr(settings, "llm_provider", "unsupported")
    with pytest.raises(ChatProviderError, match="Unsupported"):
        create_chat_provider()


def test_gemini_missing_key_is_a_safe_configuration_error(monkeypatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", None)
    with pytest.raises(ChatProviderError, match="not configured"):
        GeminiChatProvider().respond([])


def test_gemini_reads_interaction_output_text(monkeypatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    class TextInteractions:
        def create(self, **_kwargs):
            return SimpleNamespace(id="interaction-text", steps=[], output_text="Hello from Gemini.")

    provider = GeminiChatProvider(client=SimpleNamespace(interactions=TextInteractions()))
    response = provider.respond([{"role": "user", "content": "Hello"}])
    assert response.output_text == "Hello from Gemini."


def test_gemini_tool_loop_returns_authoritative_cards(db, monkeypatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(settings, "gemini_model", "gemini-test")
    interactions = FakeGeminiInteractions()
    provider = GeminiChatProvider(client=SimpleNamespace(interactions=interactions))

    response = chat(db, ChatRequest(message="Tell me about PM-KISAN"), provider)

    assert response.message == "PM-KISAN is available."
    assert [component.service_id for component in response.components] == ["PM_KISAN_001"]
    assert len(interactions.requests) == 2
    assert interactions.requests[0]["model"] == "gemini-test"
    assert interactions.requests[0]["tools"][0]["name"] == "search_services"
    assert interactions.requests[0]["generation_config"] == {"thinking_level": "low"}
    assert interactions.requests[1]["previous_interaction_id"] == "interaction-1"
    tool_response = interactions.requests[1]["input"][0]
    assert tool_response["type"] == "function_result"
    assert tool_response["name"] == "search_services"
    assert tool_response["call_id"] == "call-search"


def test_gemini_parallel_calls_keep_each_call_id(db, monkeypatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    class ParallelInteractions:
        def __init__(self):
            self.requests = []

        def create(self, **kwargs):
            self.requests.append(kwargs)
            if len(self.requests) == 1:
                return SimpleNamespace(
                    id="interaction-parallel",
                    steps=[
                        SimpleNamespace(type="function_call", id="call-search", name="search_services", arguments={"query": "PM-KISAN"}),
                        SimpleNamespace(type="function_call", id="call-detail", name="get_service_details", arguments={"service_id": "PM_KISAN_001"}),
                    ],
                    output_text="",
                )
            return SimpleNamespace(id="interaction-final", steps=[], output_text="Here are the details.")

    interactions = ParallelInteractions()
    response = chat(db, ChatRequest(message="Tell me about PM-KISAN"), GeminiChatProvider(client=SimpleNamespace(interactions=interactions)))

    assert response.message == "Here are the details."
    function_results = interactions.requests[1]["input"]
    assert [(item["name"], item["call_id"]) for item in function_results] == [
        ("search_services", "call-search"),
        ("get_service_details", "call-detail"),
    ]


def test_gemini_returns_safe_tool_failure_to_the_model(db, monkeypatch) -> None:
    monkeypatch.setattr(settings, "gemini_api_key", "test-key")

    class UnknownToolInteractions:
        def __init__(self):
            self.requests = []

        def create(self, **kwargs):
            self.requests.append(kwargs)
            if len(self.requests) == 1:
                return SimpleNamespace(
                    id="interaction-error",
                    steps=[SimpleNamespace(type="function_call", id="call-unknown", name="not_a_tool", arguments={})],
                    output_text="",
                )
            return SimpleNamespace(id="interaction-final", steps=[], output_text="Please try another request.")

    interactions = UnknownToolInteractions()
    response = chat(db, ChatRequest(message="Do something unknown"), GeminiChatProvider(client=SimpleNamespace(interactions=interactions)))

    assert response.message == "Please try another request."
    assert '"error": "UNKNOWN_TOOL"' in interactions.requests[1]["input"][0]["result"][0]["text"]


def test_model_progress_excludes_saved_application_values() -> None:
    progress = ApplicationProgress(
        application_id="application-1",
        service=ProgressService(id="PM_KISAN_001", name="PM-KISAN", department="Agriculture"),
        status="ADDITIONAL_INFO_REQUIRED",
        profile=ProfileProgress(satisfied=["full_name"], missing=[]),
        application_fields=ApplicationFieldProgress(
            satisfied=[ProgressField(key="farmer_declaration", label="Farmer declaration", field_type="checkbox", required=True, value=True)],
            missing=[],
        ),
        documents=DocumentProgress(),
        consent=ConsentProgress(granted=False, status="PENDING"),
        payment=PaymentProgress(required=False, amount=0, currency="INR", status="NOT_REQUIRED"),
        submission_status="NOT_READY",
        ready_for_review=False,
        ready_for_consent=False,
        ready_for_payment=False,
        ready_for_submission=False,
        next_stage="ADDITIONAL_INFORMATION",
    )

    result = _model_progress(progress)

    assert result["application_id"] == "application-1"
    assert "farmer_declaration" not in result
    assert "value" not in str(result)
    assert "amount" not in result
