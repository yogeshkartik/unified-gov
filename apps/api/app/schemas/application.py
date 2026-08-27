from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus


class AdditionalDataUpdate(BaseModel):
    answers: dict[str, Any] = Field(default_factory=dict)


class ApplicationDocumentSelection(BaseModel):
    document_ids: list[str] = Field(min_length=1)


class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    service_id: str
    status: ApplicationStatus
    answers: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ApplicationEngineResponse(ApplicationResponse):
    missing_profile_fields: list[str]
    missing_documents: list[str]
    missing_fields: list[str]


class ApplicationPreviewResponse(BaseModel):
    application_id: str
    status: ApplicationStatus
    profile: dict[str, Any]
    education: list[dict[str, Any]]
    documents: list[dict[str, Any]]
    answers: dict[str, Any]
    service: dict[str, Any]
    fee: float
    currency: str


class ApplicationSnapshotResponse(BaseModel):
    id: str
    application_id: str
    snapshot_json: dict[str, Any]
    created_at: datetime
