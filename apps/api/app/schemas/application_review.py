from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.application_progress import ApplicationProgress


class ReviewService(BaseModel):
    id: str
    name: str
    department: str


class ReviewValue(BaseModel):
    key: str
    label: str
    value: Any
    field_type: str
    options: list[str] | None = None


class ReviewDocument(BaseModel):
    requirement_id: str
    label: str
    document_type: str
    name: str
    source: str


class ReviewPayment(BaseModel):
    required: bool
    amount: float
    currency: str
    status: str


class ReviewConsent(BaseModel):
    granted: bool
    status: str


class ApplicationReview(BaseModel):
    type: Literal["REVIEW_CARD"] = "REVIEW_CARD"
    application_id: str
    service: ReviewService
    applicant_information: list[ReviewValue] = Field(default_factory=list)
    application_details: list[ReviewValue] = Field(default_factory=list)
    documents: list[ReviewDocument] = Field(default_factory=list)
    payment: ReviewPayment
    consent: ReviewConsent


class ConsentCard(BaseModel):
    type: Literal["CONSENT_CARD"] = "CONSENT_CARD"
    application_id: str
    purpose: str
    data_categories: list[str] = Field(default_factory=list)
    document_types: list[str] = Field(default_factory=list)
    consent_text_key: Literal["APPLICATION_PROCESSING_CONSENT"] = (
        "APPLICATION_PROCESSING_CONSENT"
    )


class ApplicationReviewRequest(BaseModel):
    application_id: str = Field(min_length=1, max_length=36)


class ApplicationReviewResponse(BaseModel):
    review: ApplicationReview
    consent_card: ConsentCard | None = None


class GrantChatConsentRequest(BaseModel):
    application_id: str = Field(min_length=1, max_length=36)
    consent_confirmed: Literal[True]


class GrantChatConsentResponse(BaseModel):
    progress: ApplicationProgress
    review: ApplicationReview
