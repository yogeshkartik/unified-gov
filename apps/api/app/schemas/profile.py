from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.profile import AddressType, DocumentSource, EducationLevel


class AddressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: AddressType
    line1: str
    line2: str | None
    city: str
    district: str
    state: str
    pincode: str


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=255)
    date_of_birth: date | None = None
    gender: str | None = Field(default=None, max_length=50)
    nationality: str | None = Field(default=None, max_length=100)
    father_name: str | None = Field(default=None, max_length=255)
    mother_name: str | None = Field(default=None, max_length=255)
    mobile: str | None = Field(default=None, max_length=20)
    email: EmailStr | None = None
    category: str | None = Field(default=None, max_length=100)
    disability_status: str | None = Field(default=None, max_length=100)


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    full_name: str
    date_of_birth: date
    gender: str | None
    nationality: str | None
    father_name: str | None
    mother_name: str | None
    mobile: str | None
    email: EmailStr | None
    category: str | None
    disability_status: str | None
    addresses: list[AddressResponse]
    created_at: datetime
    updated_at: datetime


class EducationCreate(BaseModel):
    level: EducationLevel
    board_or_university: str = Field(min_length=1, max_length=255)
    institution: str = Field(min_length=1, max_length=255)
    year: int = Field(ge=1900, le=2100)
    marks_or_percentage: str | None = Field(default=None, max_length=50)
    certificate_document_id: str | None = None


class EducationResponse(EducationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    document_type: str
    source: DocumentSource
    created_at: datetime
    updated_at: datetime
