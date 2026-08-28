from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.application import ApplicationSnapshot, ApplicationStatus
from app.models.consent import Consent, ConsentStatus
from app.models.profile import User
from app.schemas.application import ApplicationPreviewResponse
from app.services import application_engine


class ApplicationNotReadyForFinalizationError(Exception):
    def __init__(
        self,
        missing_profile_fields: list[str],
        missing_documents: list[str],
        missing_fields: list[str],
    ) -> None:
        self.missing_profile_fields = missing_profile_fields
        self.missing_documents = missing_documents
        self.missing_fields = missing_fields
        super().__init__("Application is not ready for finalization.")


class ConsentRequiredForFinalizationError(Exception):
    pass


def get_preview(db: Session, application_id: str) -> ApplicationPreviewResponse:
    application = application_engine.get_application(db, application_id)
    existing_snapshot = db.scalar(
        select(ApplicationSnapshot).where(ApplicationSnapshot.application_id == application.id)
    )
    if existing_snapshot is not None:
        preview = ApplicationPreviewResponse.model_validate(existing_snapshot.snapshot_json)
        return preview.model_copy(update={"status": application.status})
    user = db.scalar(
        select(User)
        .where(User.id == application.user_id)
        .options(
            selectinload(User.profile),
            selectinload(User.addresses),
            selectinload(User.education_records),
        )
    )
    if user is None or user.profile is None:
        raise application_engine.ApplicationNotFoundError

    return ApplicationPreviewResponse(
        application_id=application.id,
        status=application.status,
        profile={
            "full_name": user.profile.full_name,
            "date_of_birth": user.profile.date_of_birth.isoformat(),
            "gender": user.profile.gender,
            "nationality": user.profile.nationality,
            "father_name": user.profile.father_name,
            "mother_name": user.profile.mother_name,
            "mobile": user.profile.mobile,
            "email": user.profile.email,
            "category": user.profile.category,
            "disability_status": user.profile.disability_status,
            "addresses": [
                {
                    "type": address.type,
                    "line1": address.line1,
                    "line2": address.line2,
                    "city": address.city,
                    "district": address.district,
                    "state": address.state,
                    "pincode": address.pincode,
                }
                for address in user.addresses
            ],
        },
        education=[
            {
                "level": education.level,
                "board_or_university": education.board_or_university,
                "institution": education.institution,
                "year": education.year,
                "marks_or_percentage": education.marks_or_percentage,
            }
            for education in user.education_records
        ],
        documents=[
            {
                "id": application_document.document.id,
                "name": application_document.document.name,
                "document_type": application_document.document.document_type,
                "source": application_document.document.source,
            }
            for application_document in application.documents
        ],
        answers=application.answers_by_key,
        service={
            "id": application.service.id,
            "name": application.service.name,
            "department": application.service.department,
            "description": application.service.description,
            "category": application.service.category,
            "service_type": application.service.service_type,
        },
        fee=float(application.service.fee),
        currency=application.service.currency,
    )


def finalize_application(db: Session, application_id: str) -> ApplicationSnapshot:
    application = application_engine.get_application(db, application_id)
    existing_snapshot = db.scalar(
        select(ApplicationSnapshot).where(ApplicationSnapshot.application_id == application.id)
    )
    if existing_snapshot is not None:
        return existing_snapshot

    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    if consent is None or consent.status != ConsentStatus.GRANTED:
        raise ConsentRequiredForFinalizationError

    missing_profile_fields, missing_documents, missing_fields = application_engine.determine_missing_requirements(db, application)
    if missing_profile_fields or missing_documents or missing_fields:
        raise ApplicationNotReadyForFinalizationError(
            missing_profile_fields, missing_documents, missing_fields
        )

    application.status = (
        ApplicationStatus.PAYMENT_REQUIRED
        if application.service.fee > 0
        else ApplicationStatus.READY_FOR_REVIEW
    )
    db.flush()
    preview = get_preview(db, application.id)
    snapshot = ApplicationSnapshot(
        application_id=application.id,
        snapshot_json=preview.model_dump(mode="json"),
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)
    return snapshot
