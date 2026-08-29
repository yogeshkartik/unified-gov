from __future__ import annotations

from datetime import date, datetime
from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.profile import Document


class AddressType(StrEnum):
    PERMANENT = "PERMANENT"
    CORRESPONDENCE = "CORRESPONDENCE"


class EducationLevel(StrEnum):
    TENTH = "10TH"
    TWELFTH = "12TH"
    DIPLOMA = "DIPLOMA"
    GRADUATION = "GRADUATION"
    POSTGRADUATION = "POSTGRADUATION"


class DocumentSource(StrEnum):
    PROFILE_UPLOAD = "PROFILE_UPLOAD"
    DIGILOCKER = "DIGILOCKER"
    SYSTEM_GENERATED = "SYSTEM_GENERATED"


class DocumentType(StrEnum):
    # Retained only so existing callers can be normalized during the transition.
    PROFILE_PHOTO = "PROFILE_PHOTO"
    PHOTOGRAPH = "PHOTOGRAPH"
    SIGNATURE = "SIGNATURE"
    DEGREE_CERTIFICATE = "DEGREE_CERTIFICATE"
    MARKSHEET = "MARKSHEET"
    INCOME_CERTIFICATE = "INCOME_CERTIFICATE"
    CASTE_CERTIFICATE = "CASTE_CERTIFICATE"
    DOMICILE_CERTIFICATE = "DOMICILE_CERTIFICATE"
    IDENTITY_DOCUMENT = "IDENTITY_DOCUMENT"
    OTHER = "OTHER"


def new_id() -> str:
    return str(uuid4())


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str | None] = mapped_column(String(255), unique=True)
    mobile: Mapped[str | None] = mapped_column(String(20), unique=True)
    auth_state: Mapped[str] = mapped_column(String(50), default="DEMO")
    profile: Mapped[Profile | None] = relationship(back_populates="user", uselist=False)
    addresses: Mapped[list[Address]] = relationship(back_populates="user", cascade="all, delete-orphan")
    education_records: Mapped[list[Education]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    documents: Mapped[list[Document]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Profile(TimestampMixin, Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    full_name: Mapped[str] = mapped_column(String(255))
    date_of_birth: Mapped[date] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(50))
    nationality: Mapped[str | None] = mapped_column(String(100))
    father_name: Mapped[str | None] = mapped_column(String(255))
    mother_name: Mapped[str | None] = mapped_column(String(255))
    mobile: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    category: Mapped[str | None] = mapped_column(String(100))
    disability_status: Mapped[str | None] = mapped_column(String(100))
    alternate_mobile: Mapped[str | None] = mapped_column(String(20))
    marital_status: Mapped[str | None] = mapped_column(String(50))
    guardian_name: Mapped[str | None] = mapped_column(String(255))
    guardian_relationship: Mapped[str | None] = mapped_column(String(100))
    ews_status: Mapped[str | None] = mapped_column(String(30))
    ex_serviceman_status: Mapped[str | None] = mapped_column(String(30))
    minority_status: Mapped[str | None] = mapped_column(String(30))
    highest_qualification: Mapped[str | None] = mapped_column(String(100))
    current_education_status: Mapped[str | None] = mapped_column(String(100))
    current_course: Mapped[str | None] = mapped_column(String(255))
    current_institution: Mapped[str | None] = mapped_column(String(255))
    employment_status: Mapped[str | None] = mapped_column(String(50))
    occupation: Mapped[str | None] = mapped_column(String(100))
    annual_family_income_range: Mapped[str | None] = mapped_column(String(50))
    preferred_language: Mapped[str | None] = mapped_column(String(20))
    current_address_same_as_permanent: Mapped[bool] = mapped_column(Boolean, default=False)
    user: Mapped[User] = relationship(back_populates="profile")

    @property
    def addresses(self) -> list[Address]:
        return self.user.addresses

    @property
    def profile_photo(self) -> Document | None:
        return next(
            (document for document in self.user.documents if document.document_type == DocumentType.PHOTOGRAPH),
            None,
        )


class Address(TimestampMixin, Base):
    __tablename__ = "addresses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    type: Mapped[AddressType] = mapped_column(String(20))
    line1: Mapped[str] = mapped_column(String(255))
    line2: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100))
    district: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100))
    pincode: Mapped[str] = mapped_column(String(20))
    country: Mapped[str] = mapped_column(String(100), default="India")
    user: Mapped[User] = relationship(back_populates="addresses")


class Education(TimestampMixin, Base):
    __tablename__ = "education"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    level: Mapped[EducationLevel] = mapped_column(String(20))
    board_or_university: Mapped[str] = mapped_column(String(255))
    institution: Mapped[str] = mapped_column(String(255))
    year: Mapped[int] = mapped_column()
    marks_or_percentage: Mapped[str | None] = mapped_column(String(50))
    certificate_document_id: Mapped[str | None] = mapped_column(
        ForeignKey("documents.id", ondelete="SET NULL")
    )
    user: Mapped[User] = relationship(back_populates="education_records")
    certificate_document: Mapped[Document | None] = relationship(foreign_keys=[certificate_document_id])


class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    document_type: Mapped[str] = mapped_column(String(100))
    source: Mapped[DocumentSource] = mapped_column(String(30))
    storage_key: Mapped[str | None] = mapped_column(Text)
    display_name: Mapped[str | None] = mapped_column(String(100))
    original_filename: Mapped[str | None] = mapped_column(String(255))
    stored_filename: Mapped[str | None] = mapped_column(String(255))
    mime_type: Mapped[str | None] = mapped_column(String(100))
    size_bytes: Mapped[int | None] = mapped_column()
    is_imported: Mapped[bool] = mapped_column(Boolean, default=True)
    user: Mapped[User] = relationship(back_populates="documents")
