from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.integrations.government.provider import GovernmentSubmissionProvider, SubmissionResult


class MockGovernmentSubmissionProvider(GovernmentSubmissionProvider):
    """Local submission simulator; it has no government-system connectivity."""

    def submit(self, application_snapshot: dict[str, Any]) -> SubmissionResult:
        return SubmissionResult(
            government_reference_number=f"GOV-{uuid4().hex[:10].upper()}",
            submission_timestamp=datetime.now(UTC),
            status="SUBMITTED",
        )
