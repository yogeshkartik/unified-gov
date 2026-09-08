from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.application import ApplicationStatus
from app.models.consent import Consent, ConsentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.profile import AddressType, Document, DocumentSource, User
from app.schemas.application_review import (
    ApplicationReview,
    ApplicationReviewResponse,
    ConsentCard,
    ReviewConsent,
    ReviewDocument,
    ReviewPayment,
    ReviewService,
    ReviewValue,
)
from app.services import application_engine


class ApplicationNotReadyForReviewError(Exception):
    def __init__(
        self,
        missing_profile_fields: list[str],
        missing_documents: list[str],
        missing_fields: list[str],
    ) -> None:
        self.missing_profile_fields = missing_profile_fields
        self.missing_documents = missing_documents
        self.missing_fields = missing_fields
        super().__init__("Application is not ready for review.")


class ApplicationReviewUnavailableError(Exception):
    pass


REVIEWABLE_STATUSES = {
    ApplicationStatus.DRAFT,
    ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
    ApplicationStatus.CONSENT_REQUIRED,
    ApplicationStatus.READY_FOR_REVIEW,
    ApplicationStatus.PAYMENT_REQUIRED,
}


def _label(key: str) -> str:
    return key.replace("_", " ").title()


def _profile_value(user: User, key: str) -> tuple[Any, str]:
    if key == "address":
        address = next(
            (item for item in user.addresses if item.type == AddressType.PERMANENT),
            user.addresses[0] if user.addresses else None,
        )
        if address is None:
            return None, "address"
        parts = [
            address.line1,
            address.line2,
            address.city,
            address.district if address.district != address.city else None,
            address.state,
            address.pincode,
            address.country,
        ]
        return ", ".join(str(part) for part in parts if part), "address"
    if key == "education":
        if not user.education_records:
            return None, "education"
        education = max(user.education_records, key=lambda item: item.year)
        parts = [education.level, education.institution, education.year]
        return " · ".join(str(part) for part in parts if part), "education"
    value = getattr(user.profile, key, None) if user.profile is not None else None
    if hasattr(value, "isoformat"):
        return value.isoformat(), "date"
    return value, "profile"


def _consent_payload(application) -> tuple[list[str], list[str], str]:
    data_categories = [
        *application.service.required_profile_fields,
        *(field.key for field in application.service.fields),
    ]
    document_types = [
        requirement.document_type
        for requirement in application.service.document_requirements
    ]
    purpose = (
        application.service.name
        if application.service.name.lower().endswith("application")
        else f"{application.service.name} Application"
    )
    return data_categories, document_types, purpose


def get_application_review(
    db: Session, application_id: str
) -> ApplicationReviewResponse:
    """Build a live, read-only review from owned persisted application state."""
    application = application_engine.get_application(db, application_id)
    if application.status not in REVIEWABLE_STATUSES:
        raise ApplicationReviewUnavailableError

    missing_profile, missing_documents, missing_fields = (
        application_engine.determine_missing_requirements(db, application)
    )
    if missing_profile or missing_documents or missing_fields:
        raise ApplicationNotReadyForReviewError(
            missing_profile, missing_documents, missing_fields
        )

    user = db.scalar(
        select(User)
        .where(User.id == application.user_id)
        .options(
            selectinload(User.profile),
            selectinload(User.addresses),
            selectinload(User.education_records),
            selectinload(User.documents),
        )
    )
    if user is None:
        raise application_engine.ApplicationNotFoundError

    applicant_information = []
    for key in application.service.required_profile_fields:
        value, field_type = _profile_value(user, key)
        applicant_information.append(
            ReviewValue(
                key=key,
                label=_label(key),
                value=value,
                field_type=field_type,
            )
        )

    answers = application.answers_by_key
    application_details = [
        ReviewValue(
            key=field.key,
            label=field.label,
            value=answers[field.key],
            field_type=str(field.field_type),
            options=field.options,
        )
        for field in application_engine.active_service_fields(
            application.service.fields, answers
        )
        if field.key in answers
    ]

    attached = [item.document for item in application.documents if item.document]
    profile_documents = [
        document
        for document in user.documents
        if document.source == DocumentSource.PROFILE_UPLOAD
        and document.document_type in {"PHOTOGRAPH", "PROFILE_PHOTO"}
    ]
    available: list[Document] = list(
        {document.id: document for document in [*profile_documents, *attached]}.values()
    )
    documents = []
    for requirement in application.service.document_requirements:
        if not requirement.required:
            continue
        document = next(
            item
            for item in available
            if application_engine.document_type_matches(
                requirement.document_type, item.document_type
            )
        )
        documents.append(
            ReviewDocument(
                requirement_id=requirement.id,
                label=requirement.label,
                document_type=requirement.document_type,
                name=document.display_name or document.name,
                source=str(document.source),
            )
        )

    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    consent_granted = consent is not None and consent.status == ConsentStatus.GRANTED
    successful_payment = db.scalar(
        select(Payment).where(
            Payment.application_id == application.id,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )
    payment_required = float(application.service.fee) > 0
    data_categories, document_types, purpose = _consent_payload(application)
    review = ApplicationReview(
        application_id=application.id,
        service=ReviewService(
            id=application.service.id,
            name=application.service.name,
            department=application.service.department,
        ),
        applicant_information=applicant_information,
        application_details=application_details,
        documents=documents,
        payment=ReviewPayment(
            required=payment_required,
            amount=float(application.service.fee),
            currency=application.service.currency,
            status=(
                "NOT_REQUIRED"
                if not payment_required
                else "COMPLETED"
                if successful_payment is not None
                else "PENDING"
            ),
        ),
        consent=ReviewConsent(
            granted=consent_granted,
            status=str(consent.status) if consent is not None else "PENDING",
        ),
    )
    return ApplicationReviewResponse(
        review=review,
        consent_card=(
            None
            if consent_granted
            else ConsentCard(
                application_id=application.id,
                purpose=purpose,
                data_categories=data_categories,
                document_types=document_types,
            )
        ),
    )
