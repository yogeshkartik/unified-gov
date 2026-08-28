from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, selectinload

from app.models.application import Application, ApplicationAnswer, ApplicationDocument, ApplicationStatus
from app.models.consent import Consent
from app.models.profile import Profile, User
from app.models.service import Service, ServiceField, ServiceFieldType
from app.schemas.application import AdditionalDataUpdate, ApplicationEngineResponse
from app.services.profile_service import get_demo_user
from app.services.service_catalog import ServiceNotFoundError, get_service


class ApplicationNotFoundError(Exception):
    pass


class InvalidApplicationFieldsError(Exception):
    def __init__(self, fields: dict[str, str]) -> None:
        self.fields = fields
        super().__init__("Invalid application fields")


class ApplicationDeletionNotAllowedError(Exception):
    pass


def create_application(db: Session, service_id: str) -> ApplicationEngineResponse:
    service = get_service(db, service_id)
    user = get_demo_user(db)
    application = Application(user_id=user.id, service_id=service.id, status=ApplicationStatus.DRAFT)
    db.add(application)
    db.commit()
    return build_engine_response(db, application.id)


def save_additional_data(
    db: Session, application_id: str, payload: AdditionalDataUpdate
) -> ApplicationEngineResponse:
    application = get_application(db, application_id)
    fields_by_key = {field.key: field for field in application.service.fields}
    errors = validate_answers(payload.answers, fields_by_key)
    if errors:
        raise InvalidApplicationFieldsError(errors)

    answers_by_key = {answer.field_key: answer for answer in application.answers}
    for key, value in payload.answers.items():
        answer = answers_by_key.get(key)
        if answer is None:
            db.add(ApplicationAnswer(application_id=application.id, field_key=key, value=value))
        else:
            answer.value = value
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


def delete_draft_application(db: Session, application_id: str) -> None:
    application = get_application(db, application_id)
    if application.status != ApplicationStatus.DRAFT:
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
    missing_documents = [
        requirement.document_type
        for requirement in application.service.document_requirements
        if requirement.required
        and not any(
            document_type_matches(requirement.document_type, document.document_type)
            for document in user.documents
        )
    ]
    return (
        missing_profile_fields,
        missing_documents,
        required_field_keys(application.service.fields, application.answers_by_key),
    )


def document_type_matches(required_type: str, available_type: str) -> bool:
    """Return whether a concrete citizen document satisfies a service requirement."""
    if required_type == available_type:
        return True
    if required_type == "PHOTOGRAPH":
        return available_type == "PROFILE_PHOTO"
    if required_type == "MARKSHEET":
        return available_type.endswith("_MARKSHEET")
    if required_type == "IDENTITY_DOCUMENT":
        return available_type == "DRIVING_LICENCE"
    return False


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
        return None if isinstance(value, int | float) and not isinstance(value, bool) else "Expected a numeric value."
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
