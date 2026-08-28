from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

from app.models.profile import AddressType, DocumentSource, DocumentType, EducationLevel


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
    country: str


class AddressUpdate(BaseModel):
    type: AddressType
    line1: str = Field(default="", max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(default="", max_length=100)
    district: str = Field(default="", max_length=100)
    state: str = Field(default="", max_length=100)
    pincode: str = Field(default="", pattern=r"^(\d{6})?$")
    country: str = Field(default="India", min_length=1, max_length=100)


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
    alternate_mobile: str | None = Field(default=None, pattern=r"^[6-9]\d{9}$")
    marital_status: str | None = Field(default=None, max_length=50)
    guardian_name: str | None = Field(default=None, max_length=255)
    guardian_relationship: str | None = Field(default=None, max_length=100)
    ews_status: str | None = Field(default=None, max_length=30)
    ex_serviceman_status: str | None = Field(default=None, max_length=30)
    minority_status: str | None = Field(default=None, max_length=30)
    highest_qualification: str | None = Field(default=None, max_length=100)
    current_education_status: str | None = Field(default=None, max_length=100)
    current_course: str | None = Field(default=None, max_length=255)
    current_institution: str | None = Field(default=None, max_length=255)
    employment_status: str | None = Field(default=None, max_length=50)
    occupation: str | None = Field(default=None, max_length=100)
    annual_family_income_range: str | None = Field(default=None, max_length=50)
    preferred_language: str | None = Field(default=None, max_length=20)
    current_address_same_as_permanent: bool | None = None
    addresses: list[AddressUpdate] | None = None

    @model_validator(mode="after")
    def complete_empty_correspondence_address(self) -> "ProfileUpdate":
        if self.addresses is None:
            return self
        permanent = next((item for item in self.addresses if item.type == AddressType.PERMANENT), None)
        correspondence = next((item for item in self.addresses if item.type == AddressType.CORRESPONDENCE), None)
        if permanent and correspondence and not any((correspondence.line1, correspondence.city, correspondence.district, correspondence.state, correspondence.pincode)):
            correspondence.line1 = permanent.line1
            correspondence.line2 = permanent.line2
            correspondence.city = permanent.city
            correspondence.district = permanent.district
            correspondence.state = permanent.state
            correspondence.pincode = permanent.pincode
            correspondence.country = permanent.country
            self.current_address_same_as_permanent = True
        if permanent and not all((permanent.line1, permanent.city, permanent.district, permanent.state, permanent.pincode)):
            raise ValueError("Permanent address is incomplete.")
        return self


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
    alternate_mobile: str | None
    marital_status: str | None
    guardian_name: str | None
    guardian_relationship: str | None
    ews_status: str | None
    ex_serviceman_status: str | None
    minority_status: str | None
    highest_qualification: str | None
    current_education_status: str | None
    current_course: str | None
    current_institution: str | None
    employment_status: str | None
    occupation: str | None
    annual_family_income_range: str | None
    preferred_language: str | None
    current_address_same_as_permanent: bool
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
    display_name: str | None
    original_filename: str | None
    mime_type: str | None
    size_bytes: int | None
    source: DocumentSource
    created_at: datetime
    updated_at: datetime


class DocumentCategoryResponse(BaseModel):
    value: str
    label: str


class DocumentRename(BaseModel):
    display_name: str = Field(min_length=1, max_length=100)

    def model_post_init(self, __context: object) -> None:
        self.display_name = self.display_name.strip()
        if not self.display_name:
            raise ValueError("Document name cannot be blank.")
