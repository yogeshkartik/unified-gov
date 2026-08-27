from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol


@dataclass(frozen=True)
class SubmissionResult:
    government_reference_number: str
    submission_timestamp: datetime
    status: str


class GovernmentSubmissionProvider(Protocol):
    def submit(self, application_snapshot: dict[str, Any]) -> SubmissionResult: ...
