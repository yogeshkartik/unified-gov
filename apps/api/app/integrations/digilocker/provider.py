from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class ProviderDocument:
    id: str
    name: str
    document_type: str
    issuer: str


@dataclass(frozen=True)
class ProviderConsent:
    user_id: str
    document_ids: list[str]
    status: str


class DocumentProvider(Protocol):
    def get_documents(self, user_id: str) -> list[ProviderDocument]: ...

    def get_document(self, document_id: str) -> ProviderDocument: ...

    def request_consent(self, user_id: str, document_ids: list[str]) -> ProviderConsent: ...
