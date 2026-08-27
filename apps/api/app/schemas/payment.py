from datetime import datetime

from pydantic import BaseModel

from app.models.application import ApplicationStatus
from app.models.payment import PaymentStatus


class PaymentProcessResponse(BaseModel):
    application_id: str
    skipped: bool
    status: PaymentStatus | None
    transaction_id: str | None
    amount: float
    currency: str


class SubmissionResponse(BaseModel):
    application_id: str
    government_reference_number: str
    submission_timestamp: datetime
    status: ApplicationStatus
