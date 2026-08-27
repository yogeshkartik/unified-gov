from pydantic import BaseModel, Field


class DigiLockerDocumentResponse(BaseModel):
    id: str
    name: str
    document_type: str
    issuer: str


class DigiLockerConsentRequest(BaseModel):
    document_ids: list[str] = Field(min_length=1)


class DigiLockerConsentResponse(BaseModel):
    user_id: str
    document_ids: list[str]
    status: str
