from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus


class AdditionalDataUpdate(BaseModel):
    answers: dict[str, Any] = Field(default_factory=dict)


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
