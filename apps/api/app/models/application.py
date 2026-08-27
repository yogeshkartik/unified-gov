from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from sqlalchemy import DateTime, ForeignKey, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.profile import Document, TimestampMixin, User, new_id
from app.models.service import Service


class ApplicationStatus(StrEnum):
    DRAFT = "DRAFT"
    ADDITIONAL_INFO_REQUIRED = "ADDITIONAL_INFO_REQUIRED"
    CONSENT_REQUIRED = "CONSENT_REQUIRED"
    READY_FOR_REVIEW = "READY_FOR_REVIEW"
    PAYMENT_REQUIRED = "PAYMENT_REQUIRED"
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Application(TimestampMixin, Base):
    __tablename__ = "applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id", ondelete="RESTRICT"))
    status: Mapped[ApplicationStatus] = mapped_column(String(30), default=ApplicationStatus.DRAFT)
    government_reference_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user: Mapped[User] = relationship()
    service: Mapped[Service] = relationship()
    answers: Mapped[list[ApplicationAnswer]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    documents: Mapped[list[ApplicationDocument]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    snapshot: Mapped[ApplicationSnapshot | None] = relationship(
        back_populates="application", uselist=False, cascade="all, delete-orphan"
    )
    payments: Mapped[list[Payment]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )

    @property
    def answers_by_key(self) -> dict[str, Any]:
        return {answer.field_key: answer.value for answer in self.answers}


class ApplicationAnswer(TimestampMixin, Base):
    __tablename__ = "application_answers"
    __table_args__ = (UniqueConstraint("application_id", "field_key", name="uq_application_answer_key"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"))
    field_key: Mapped[str] = mapped_column(String(100))
    value: Mapped[Any] = mapped_column(JSON)
    application: Mapped[Application] = relationship(back_populates="answers")


class ApplicationDocument(TimestampMixin, Base):
    __tablename__ = "application_documents"
    __table_args__ = (UniqueConstraint("application_id", "document_id", name="uq_application_document"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    application_id: Mapped[str] = mapped_column(ForeignKey("applications.id", ondelete="CASCADE"))
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id", ondelete="RESTRICT"))
    application: Mapped[Application] = relationship(back_populates="documents")
    document: Mapped[Document] = relationship()


class ApplicationSnapshot(Base):
    __tablename__ = "application_snapshots"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    application_id: Mapped[str] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), unique=True
    )
    snapshot_json: Mapped[dict[str, Any]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    application: Mapped[Application] = relationship(back_populates="snapshot")
