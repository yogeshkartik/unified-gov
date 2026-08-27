from __future__ import annotations

from datetime import date
from enum import StrEnum
from typing import Any

from sqlalchemy import Date, ForeignKey, JSON, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.profile import TimestampMixin, new_id


class ServiceType(StrEnum):
    EXAM = "EXAM"
    SCHOLARSHIP = "SCHOLARSHIP"
    LICENCE = "LICENCE"
    CERTIFICATE = "CERTIFICATE"
    SCHEME = "SCHEME"
    RECRUITMENT = "RECRUITMENT"
    ADMISSION = "ADMISSION"
    OTHER = "OTHER"


class ServiceStatus(StrEnum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    DRAFT = "DRAFT"


class ServiceFieldType(StrEnum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    RADIO = "radio"
    CHECKBOX = "checkbox"
    TEXTAREA = "textarea"
    FILE = "file"


class Service(TimestampMixin, Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    department: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    service_type: Mapped[ServiceType] = mapped_column(String(50))
    category: Mapped[str] = mapped_column(String(100))
    status: Mapped[ServiceStatus] = mapped_column(String(20))
    fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    instructions: Mapped[str | None] = mapped_column(Text)
    required_profile_fields: Mapped[list[str]] = mapped_column(JSON, default=list)
    fields: Mapped[list[ServiceField]] = relationship(
        back_populates="service", cascade="all, delete-orphan", order_by="ServiceField.position"
    )
    document_requirements: Mapped[list[ServiceDocumentRequirement]] = relationship(
        back_populates="service", cascade="all, delete-orphan", order_by="ServiceDocumentRequirement.position"
    )


class ServiceField(TimestampMixin, Base):
    __tablename__ = "service_fields"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"))
    key: Mapped[str] = mapped_column(String(100))
    label: Mapped[str] = mapped_column(String(255))
    field_type: Mapped[ServiceFieldType] = mapped_column(String(20))
    required: Mapped[bool] = mapped_column(default=False)
    options: Mapped[list[str] | None] = mapped_column(JSON)
    help_text: Mapped[str | None] = mapped_column(Text)
    position: Mapped[int] = mapped_column(default=0)
    service: Mapped[Service] = relationship(back_populates="fields")


class ServiceDocumentRequirement(TimestampMixin, Base):
    __tablename__ = "service_document_requirements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"))
    document_type: Mapped[str] = mapped_column(String(100))
    label: Mapped[str] = mapped_column(String(255))
    required: Mapped[bool] = mapped_column(default=True)
    position: Mapped[int] = mapped_column(default=0)
    service: Mapped[Service] = relationship(back_populates="document_requirements")
