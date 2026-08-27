from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.application import Application
from app.models.profile import TimestampMixin, User, new_id
from app.models.service import Service


class ConsentStatus(StrEnum):
    GRANTED = "GRANTED"
    DENIED = "DENIED"
    REVOKED = "REVOKED"


class Consent(TimestampMixin, Base):
    __tablename__ = "consents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    application_id: Mapped[str] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"), unique=True
    )
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id", ondelete="RESTRICT"))
    data_categories: Mapped[list[str]] = mapped_column(JSON)
    document_ids: Mapped[list[str]] = mapped_column(JSON)
    document_types: Mapped[list[str]] = mapped_column(JSON)
    purpose: Mapped[str] = mapped_column(Text)
    status: Mapped[ConsentStatus] = mapped_column(String(20))
    granted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user: Mapped[User] = relationship()
    application: Mapped[Application] = relationship()
    service: Mapped[Service] = relationship()

    @property
    def data_requested(self) -> list[str]:
        return self.data_categories
