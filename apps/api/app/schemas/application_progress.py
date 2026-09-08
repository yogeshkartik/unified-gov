from typing import Any, Literal

from pydantic import BaseModel, Field


class ProgressService(BaseModel):
    id: str
    name: str
    department: str


class ProgressField(BaseModel):
    key: str
    label: str
    field_type: str
    required: bool
    options: list[str] | None = None
    value: Any | None = None


class ProfileProgress(BaseModel):
    satisfied: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)


class ApplicationFieldProgress(BaseModel):
    satisfied: list[ProgressField] = Field(default_factory=list)
    missing: list[ProgressField] = Field(default_factory=list)


class ProgressDocument(BaseModel):
    requirement_id: str
    document_type: str
    label: str
    required: bool
    document_id: str | None = None


class DocumentProgress(BaseModel):
    satisfied: list[ProgressDocument] = Field(default_factory=list)
    missing: list[ProgressDocument] = Field(default_factory=list)


class ConsentProgress(BaseModel):
    required: bool = True
    granted: bool
    status: str


class PaymentProgress(BaseModel):
    required: bool
    amount: float
    currency: str
    status: str


class ApplicationProgress(BaseModel):
    type: Literal["APPLICATION_PROGRESS"] = "APPLICATION_PROGRESS"
    application_id: str
    service: ProgressService
    status: str
    profile: ProfileProgress
    application_fields: ApplicationFieldProgress
    documents: DocumentProgress
    consent: ConsentProgress
    payment: PaymentProgress
    submission_status: str
    ready_for_review: bool
    ready_for_consent: bool
    ready_for_payment: bool
    ready_for_submission: bool
    next_stage: str


class ProfileToolResult(BaseModel):
    permanent_state: str | None
    permanent_state_code: str | None
    available_profile_fields: list[str]
    missing_profile_fields: list[str]


class StartApplicationRequest(BaseModel):
    service_id: str = Field(min_length=1, max_length=100)


class StartApplicationResponse(BaseModel):
    result: Literal["CREATED", "RESUMED"]
    application_id: str
    progress: ApplicationProgress
