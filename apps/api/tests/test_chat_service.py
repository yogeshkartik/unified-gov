from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base
from app.schemas.chat import ChatRequest
from app.services.chat_service import ChatProviderError, _tool_result, chat
from app.services.seed import seed_demo_services
from app.services.service_catalog import search_services


@pytest.fixture
def db(tmp_path) -> Session:
    engine = create_engine(f"sqlite:///{tmp_path / 'chat.db'}")
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed_demo_services(session)
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def test_search_returns_active_canonical_services_only(db: Session) -> None:
    matches = search_services(db, "engineering entrance exam")
    assert [service.id for service in matches][:1] == ["JEE_MAIN_001"]
    assert all(service.status == "OPEN" for service in matches)
    assert "CUET_UG_001" not in {service.id for service in search_services(db, "university entrance")}


def test_details_tool_validates_ids_and_returns_canonical_requirements(db: Session) -> None:
    selected = {}
    details = _tool_result(db, "get_service_details", {"service_id": "PM_KISAN_001"}, selected)
    assert details["service"]["name"] == "PM-KISAN"
    assert details["required_documents"] == ["Identity Document", "Land or Supporting Document"]
    assert _tool_result(db, "get_service_details", {"service_id": "not-real"}, selected) == {"error": "SERVICE_NOT_FOUND"}


class FakeProvider:
    def __init__(self) -> None: self.calls = 0
    def respond(self, _items):
        self.calls += 1
        if self.calls == 1:
            return SimpleNamespace(output=[SimpleNamespace(type="function_call", name="search_services", arguments='{"query":"PM-KISAN"}', call_id="call_1")], output_text="")
        return SimpleNamespace(output=[], output_text="PM-KISAN is available in this portal and is free to apply.")


def test_chat_runs_narrow_tool_flow_and_returns_cards(db: Session) -> None:
    response = chat(db, ChatRequest(message="What is PM-KISAN?"), FakeProvider())
    assert response.message.startswith("PM-KISAN")
    assert [card.service_id for card in response.components] == ["PM_KISAN_001"]


def test_provider_failure_is_safe(db: Session) -> None:
    class FailingProvider:
        def respond(self, _items): raise ChatProviderError("private provider detail")
    with pytest.raises(ChatProviderError):
        chat(db, ChatRequest(message="passport"), FailingProvider())
