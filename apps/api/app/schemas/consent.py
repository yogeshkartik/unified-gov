from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.consent import ConsentStatus


class ConsentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    application_id: str
    service_id: str
    data_requested: list[str]
    document_types: list[str]
    document_ids: list[str]
    purpose: str
    status: ConsentStatus
    granted_at: datetime | None
    created_at: datetime
    updated_at: datetime
