from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.application_progress import ApplicationProgress, ApplicationQuestion, DocumentRequest


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatHistoryMessage] = Field(default_factory=list, max_length=12)
    locale: str = Field(default="en", max_length=10)
    active_application_id: str | None = Field(default=None, max_length=36)


class ChatServiceCard(BaseModel):
    type: Literal["SERVICE_CARD"] = "SERVICE_CARD"
    service_id: str
    name: str
    description: str
    department: str
    category: str
    government_level: str
    jurisdiction_code: str
    fee: float
    currency: str


class ChatResponse(BaseModel):
    message: str
    components: list[ChatServiceCard | ApplicationProgress | ApplicationQuestion | DocumentRequest] = Field(default_factory=list)
