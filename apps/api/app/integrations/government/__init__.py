from app.integrations.government.mock import MockGovernmentSubmissionProvider
from app.integrations.government.provider import GovernmentSubmissionProvider

government_submission_provider: GovernmentSubmissionProvider = MockGovernmentSubmissionProvider()

__all__ = [
    "GovernmentSubmissionProvider",
    "MockGovernmentSubmissionProvider",
    "government_submission_provider",
]
