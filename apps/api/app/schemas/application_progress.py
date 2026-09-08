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


class QuestionField(BaseModel):
    key: str
    label: str
    field_type: str
    required: bool
    options: list[str] | None = None
    help_text: str | None = None


class ApplicationQuestion(BaseModel):
    type: Literal["TEXT_QUESTION", "TEXTAREA_QUESTION", "SELECT_QUESTION", "BOOLEAN_QUESTION", "NUMBER_QUESTION"]
    application_id: str
    field: QuestionField


class DocumentRequirement(BaseModel):
    id: str
    label: str
    document_type: str
    required: bool


class AvailableDocument(BaseModel):
    document_id: str
    name: str
    document_type: str
    source: str


class AvailableDigiLockerDocument(BaseModel):
    document_id: str
    name: str
    document_type: str
    issuer: str


class DocumentRequest(BaseModel):
    type: Literal["DOCUMENT_REQUEST"] = "DOCUMENT_REQUEST"
    application_id: str
    requirement: DocumentRequirement
    existing_documents: list[AvailableDocument] = Field(default_factory=list)
    digilocker_options: list[AvailableDigiLockerDocument] = Field(default_factory=list)
    upload_allowed: bool = True


class StartApplicationResponse(BaseModel):
    result: Literal["CREATED", "RESUMED"]
    application_id: str
    progress: ApplicationProgress
    next_question: ApplicationQuestion | None = None
    next_document: DocumentRequest | None = None


class SetApplicationFieldRequest(BaseModel):
    application_id: str = Field(min_length=1, max_length=36)
    field_key: str = Field(min_length=1, max_length=100)
    value: Any


class SetApplicationFieldResponse(BaseModel):
    saved_field_key: str
    saved_value: Any
    progress: ApplicationProgress
    next_question: ApplicationQuestion | None = None
    next_document: DocumentRequest | None = None


class ApplicationDocumentActionRequest(BaseModel):
    application_id: str = Field(min_length=1, max_length=36)
    requirement_id: str = Field(min_length=1, max_length=36)
    document_id: str = Field(min_length=1, max_length=100)


class ListApplicationDocumentsRequest(BaseModel):
    application_id: str = Field(min_length=1, max_length=36)


class ApplicationDocumentActionResponse(BaseModel):
    attached_document: AvailableDocument
    progress: ApplicationProgress
    next_document: DocumentRequest | None = None
