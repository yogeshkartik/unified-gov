from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.service import ServiceFieldType, ServiceStatus, ServiceType


class ServiceFieldResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    label: str
    field_type: ServiceFieldType
    required: bool
    options: list[str] | None
    help_text: str | None
    position: int


class ServiceDocumentRequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_type: str
    label: str
    required: bool
    position: int


class ServiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    department: str
    description: str
    service_type: ServiceType
    category: str
    status: ServiceStatus
    fee: float
    currency: str
    start_date: date | None
    end_date: date | None
    instructions: str | None
    created_at: datetime
    updated_at: datetime


class ServiceDetailResponse(ServiceResponse):
    required_profile_fields: list[str]
    fields: list[ServiceFieldResponse]
    document_requirements: list[ServiceDocumentRequirementResponse]


class ServiceRequirementsResponse(BaseModel):
    service_id: str
    required_profile_fields: list[str]
    fields: list[ServiceFieldResponse]
    document_requirements: list[ServiceDocumentRequirementResponse]
