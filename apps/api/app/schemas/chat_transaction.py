from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.application_progress import ApplicationProgress
from app.schemas.payment import PaymentProcessResponse


class TransactionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    application_id: str = Field(min_length=1, max_length=36)


class PaymentCard(BaseModel):
    type: Literal["PAYMENT_CARD"] = "PAYMENT_CARD"
    application_id: str
    amount: float
    currency: str
    payment_status: Literal["PENDING", "SUCCESS", "FAILED"]
    demo: Literal[True] = True
    transaction_reference: str | None = None
    completed_at: datetime | None = None


class SubmissionConfirmation(BaseModel):
    type: Literal["SUBMISSION_CONFIRMATION"] = "SUBMISSION_CONFIRMATION"
    application_id: str
    service_name: str


class SubmissionSuccess(BaseModel):
    type: Literal["SUBMISSION_SUCCESS"] = "SUBMISSION_SUCCESS"
    application_id: str
    service_name: str
    reference_number: str
    submitted_at: datetime
    status: Literal["SUBMITTED"]


class TransactionComponentsResponse(BaseModel):
    payment_card: PaymentCard | None = None
    submission_confirmation: SubmissionConfirmation | None = None
    submission_success: SubmissionSuccess | None = None


class PayApplicationResponse(BaseModel):
    payment: PaymentProcessResponse
    payment_card: PaymentCard
    progress: ApplicationProgress
    submission_confirmation: SubmissionConfirmation | None = None


class SubmitApplicationRequest(TransactionRequest):
    submission_confirmed: Literal[True]


class SubmitApplicationResponse(BaseModel):
    progress: ApplicationProgress
    success: SubmissionSuccess
