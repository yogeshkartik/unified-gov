from __future__ import annotations

from datetime import date
from math import isfinite
import re
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.application import Application, ApplicationAnswer, ApplicationDocument, ApplicationStatus
from app.models.consent import Consent, ConsentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.profile import DocumentSource, DocumentType, Profile, User
from app.models.service import Service, ServiceField, ServiceFieldType
from app.schemas.application import (
    AdditionalDataUpdate,
    ApplicationDetailResponse,
    ApplicationEngineResponse,
    ApplicationListResponse,
)
from app.services.profile_service import get_demo_user
from app.services.service_catalog import ServiceNotFoundError, get_service


class ApplicationNotFoundError(Exception):
    pass


class ApplicationDownloadNotAvailableError(Exception):
    pass


class InvalidApplicationFieldsError(Exception):
    def __init__(self, fields: dict[str, str]) -> None:
        self.fields = fields
        super().__init__("Invalid application fields")


class ApplicationDeletionNotAllowedError(Exception):
    pass


ACTIONABLE_STATUSES = {
    ApplicationStatus.DRAFT,
    ApplicationStatus.ADDITIONAL_INFO_REQUIRED,
    ApplicationStatus.CONSENT_REQUIRED,
    ApplicationStatus.READY_FOR_REVIEW,
    ApplicationStatus.PAYMENT_REQUIRED,
}


# Mirrors the numeric formats users can enter in a form, including incomplete-looking
# but valid decimal notation such as "5.".  Values are normalized before they are
# saved so every service form stores a JSON number consistently.
NUMERIC_TEXT_PATTERN = re.compile(r"[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$")


def required_status(missing_fields: list[str], consent_granted: bool = False) -> ApplicationStatus:
    if missing_fields:
        return ApplicationStatus.ADDITIONAL_INFO_REQUIRED
    if not consent_granted:
        return ApplicationStatus.CONSENT_REQUIRED
    return ApplicationStatus.READY_FOR_REVIEW


def create_application(db: Session, service_id: str) -> ApplicationEngineResponse:
    service = get_service(db, service_id)
    user = get_demo_user(db)
    application = Application(user_id=user.id, service_id=service.id, status=ApplicationStatus.DRAFT)
    db.add(application)
    db.flush()
    application.status = required_status(required_field_keys(service.fields, {}))
    db.commit()
    return build_engine_response(db, application.id)


def save_additional_data(
    db: Session, application_id: str, payload: AdditionalDataUpdate
) -> ApplicationEngineResponse:
    application = get_application(db, application_id)
    fields_by_key = {field.key: field for field in application.service.fields}
    answers = normalize_answers(payload.answers, fields_by_key)
    errors = validate_answers(answers, fields_by_key)
    if errors:
        raise InvalidApplicationFieldsError(errors)

    answers_by_key = {answer.field_key: answer for answer in application.answers}
    next_answers = application.answers_by_key.copy()
    for key, value in answers.items():
        answer = answers_by_key.get(key)
        if answer is None:
            db.add(ApplicationAnswer(application_id=application.id, field_key=key, value=value))
        else:
            answer.value = value
        next_answers[key] = value
    db.flush()
    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    application.status = required_status(
        required_field_keys(application.service.fields, next_answers),
        consent is not None and consent.status == ConsentStatus.GRANTED,
    )
    db.commit()
    return build_engine_response(db, application.id)


def get_application(db: Session, application_id: str) -> Application:
    user = get_demo_user(db)
    application = db.scalar(
        select(Application)
        .where(Application.id == application_id, Application.user_id == user.id)
        .options(
            selectinload(Application.answers),
            selectinload(Application.documents).selectinload(ApplicationDocument.document),
            selectinload(Application.service).selectinload(Service.fields),
            selectinload(Application.service).selectinload(Service.document_requirements),
        )
    )
    if application is None:
        raise ApplicationNotFoundError
    return application


def get_downloadable_application(db: Session, application_id: str) -> Application:
    application = get_application(db, application_id)
    final_statuses = {
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.PROCESSING,
        ApplicationStatus.COMPLETED,
    }
    if application.status not in final_statuses or not application.government_reference_number:
        raise ApplicationDownloadNotAvailableError
    return application


def delete_draft_application(db: Session, application_id: str) -> None:
    application = get_application(db, application_id)
    if application.status not in ACTIONABLE_STATUSES:
        raise ApplicationDeletionNotAllowedError
    db.execute(delete(Consent).where(Consent.application_id == application.id))
    db.delete(application)
    db.commit()


def build_engine_response(db: Session, application_id: str) -> ApplicationEngineResponse:
    application = get_application(db, application_id)
    missing_profile_fields, missing_documents, missing_fields = determine_missing_requirements(db, application)
    return ApplicationEngineResponse(
        id=application.id,
        user_id=application.user_id,
        service_id=application.service_id,
        status=application.status,
        answers=application.answers_by_key,
        created_at=application.created_at,
        updated_at=application.updated_at,
        missing_profile_fields=missing_profile_fields,
        missing_documents=missing_documents,
        missing_fields=missing_fields,
    )


def list_applications(db: Session) -> list[ApplicationListResponse]:
    user = get_demo_user(db)
    applications = list(
        db.scalars(
            select(Application)
            .where(Application.user_id == user.id)
            .options(selectinload(Application.service))
            .order_by(Application.updated_at.desc())
        ).all()
    )
    return [
        ApplicationListResponse(
            id=application.id,
            service_id=application.service_id,
            service_name=application.service.name,
            department=application.service.department,
            status=application.status,
            reference_number=application.government_reference_number,
            created_at=application.created_at,
            updated_at=application.updated_at,
            submitted_at=application.submitted_at,
            requires_action=application.status in ACTIONABLE_STATUSES,
        )
        for application in applications
    ]


def get_application_detail(db: Session, application_id: str) -> ApplicationDetailResponse:
    application = get_application(db, application_id)
    engine = build_engine_response(db, application_id)
    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    successful_payment = db.scalar(
        select(Payment).where(
            Payment.application_id == application.id,
            Payment.status == PaymentStatus.SUCCESS,
        )
    )
    failed_payment = db.scalar(
        select(Payment).where(
            Payment.application_id == application.id,
            Payment.status == PaymentStatus.FAILED,
        )
    )
    if float(application.service.fee) <= 0:
        payment_status = "NOT_REQUIRED"
    elif successful_payment is not None:
        payment_status = "COMPLETED"
    elif failed_payment is not None:
        payment_status = "FAILED"
    else:
        payment_status = "PENDING"
    submission_status = (
        str(application.status)
        if application.submitted_at is not None
        or application.status
        in {
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.PROCESSING,
            ApplicationStatus.COMPLETED,
            ApplicationStatus.REJECTED,
        }
        else None
    )
    return ApplicationDetailResponse(
        **engine.model_dump(),
        service_name=application.service.name,
        department=application.service.department,
        reference_number=application.government_reference_number,
        submitted_at=application.submitted_at,
        consent_status=str(consent.status) if consent is not None else None,
        payment_status=payment_status,
        submission_status=submission_status,
    )


def determine_missing_requirements(db: Session, application: Application) -> tuple[list[str], list[str], list[str]]:
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
        return application.service.required_profile_fields, [], required_field_keys(application.service.fields, {})

    missing_profile_fields = [
        field for field in application.service.required_profile_fields if not has_profile_data(user, field)
    ]
    profile_documents = [
        document for document in user.documents
        if document.source == DocumentSource.PROFILE_UPLOAD
        and document.document_type == DocumentType.PROFILE_PHOTO
    ]
    attached_docs = [app_doc.document for app_doc in application.documents if app_doc.document]
    available_docs = list({d.id: d for d in (profile_documents + attached_docs)}.values())

    missing_documents = [
        requirement.document_type
        for requirement in application.service.document_requirements
        if requirement.required
        and not any(
            document_type_matches(requirement.document_type, document.document_type)
            for document in available_docs
        )
    ]
    return (
        missing_profile_fields,
        missing_documents,
        required_field_keys(application.service.fields, application.answers_by_key),
    )


def document_type_matches(required_type: str, available_type: str) -> bool:
    """Return whether structured document categories satisfy a service requirement."""
    normalized_required = _canonical_document_type(required_type)
    normalized_available = _canonical_document_type(available_type)
    if normalized_required == normalized_available:
        return True
    if normalized_required == DocumentType.MARKSHEET:
        return normalized_available.endswith("_MARKSHEET")
    if normalized_required == DocumentType.IDENTITY_DOCUMENT:
        return normalized_available == "DRIVING_LICENCE"
    return False


def _canonical_document_type(document_type: str) -> str:
    """Keep compatibility with the reusable profile-photo category in one place."""
    if document_type == DocumentType.PROFILE_PHOTO:
        return DocumentType.PHOTOGRAPH
    return document_type


def has_profile_data(user: User, field: str) -> bool:
    if field == "address":
        return bool(user.addresses)
    if field == "education":
        return bool(user.education_records)
    profile: Profile | None = user.profile
    if profile is None or not hasattr(profile, field):
        return False
    return has_value(getattr(profile, field))


def required_field_keys(fields: list[ServiceField], answers: dict[str, Any]) -> list[str]:
    return [field.key for field in fields if field.required and not has_value(answers.get(field.key))]


def has_value(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, bool):
        return value
    return True


def validate_answers(answers: dict[str, Any], fields_by_key: dict[str, ServiceField]) -> dict[str, str]:
    errors: dict[str, str] = {}
    for key, value in answers.items():
        field = fields_by_key.get(key)
        if field is None:
            errors[key] = "This field is not defined for the selected service."
            continue
        error = validate_field_value(field, value)
        if error:
            errors[key] = error
    return errors


def normalize_answers(answers: dict[str, Any], fields_by_key: dict[str, ServiceField]) -> dict[str, Any]:
    """Convert valid numeric form text to JSON numbers before validation and storage."""
    normalized = answers.copy()
    for key, value in answers.items():
        field = fields_by_key.get(key)
        if field is None or field.field_type != ServiceFieldType.NUMBER or not isinstance(value, str):
            continue
        numeric_text = value.strip()
        if not numeric_text:
            normalized[key] = None
            continue
        if NUMERIC_TEXT_PATTERN.fullmatch(numeric_text):
            numeric_value = float(numeric_text)
            if isfinite(numeric_value):
                normalized[key] = numeric_value
    return normalized


def validate_field_value(field: ServiceField, value: Any) -> str | None:
    if value is None:
        return None
    if field.options:
        if not isinstance(value, str):
            return "Expected a selected option."
        return None if value in field.options else "Selected option is not allowed."
    if field.field_type in {ServiceFieldType.TEXT, ServiceFieldType.TEXTAREA, ServiceFieldType.FILE}:
        return None if isinstance(value, str) else "Expected a text value."
    if field.field_type == ServiceFieldType.NUMBER:
        return (
            None
            if isinstance(value, int | float) and not isinstance(value, bool) and isfinite(value)
            else "Expected a numeric value."
        )
    if field.field_type == ServiceFieldType.DATE:
        if not isinstance(value, str):
            return "Expected an ISO-8601 date string."
        try:
            date.fromisoformat(value)
        except ValueError:
            return "Expected an ISO-8601 date string."
        return None
    if field.field_type in {ServiceFieldType.SELECT, ServiceFieldType.RADIO}:
        return None if isinstance(value, str) else "Expected a selected option."
    if field.field_type == ServiceFieldType.CHECKBOX:
        return None if isinstance(value, bool) else "Expected a boolean value."
    return None
