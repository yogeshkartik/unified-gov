from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consent import Consent, ConsentStatus
from app.models.application import ApplicationDocument, ApplicationStatus
from app.models.profile import Document, DocumentSource
from app.services import application_engine


class ApplicationIncompleteForConsentError(Exception):
    def __init__(
        self,
        missing_profile_fields: list[str],
        missing_documents: list[str],
        missing_fields: list[str],
    ) -> None:
        self.missing_profile_fields = missing_profile_fields
        self.missing_documents = missing_documents
        self.missing_fields = missing_fields
        super().__init__("Application requirements are incomplete.")


# Backwards-compatible name for callers that only handled missing additional data.
ConsentAdditionalDataRequiredError = ApplicationIncompleteForConsentError


def grant_consent(db: Session, application_id: str) -> Consent:
    application = application_engine.get_application(db, application_id)
    application_engine.ensure_editable(application)
    missing_profile_fields, missing_documents, missing_fields = (
        application_engine.determine_missing_requirements(db, application)
    )
    if missing_profile_fields or missing_documents or missing_fields:
        raise ApplicationIncompleteForConsentError(
            missing_profile_fields, missing_documents, missing_fields
        )

    data_categories = [
        *application.service.required_profile_fields,
        *(field.key for field in application.service.fields),
    ]
    document_types = [
        requirement.document_type for requirement in application.service.document_requirements
    ]
    citizen_documents = list(db.scalars(select(Document).where(Document.user_id == application.user_id)).all())
    eligible_documents = [
        document
        for document in citizen_documents
        if document.source == DocumentSource.PROFILE_UPLOAD
        or any(item.document_id == document.id for item in application.documents)
    ]
    document_ids = [
        document.id
        for document in eligible_documents
        if any(
            application_engine.document_type_matches(required_type, document.document_type)
            for required_type in document_types
        )
    ]
    attached_ids = {item.document_id for item in application.documents}
    for document_id in document_ids:
        if document_id not in attached_ids:
            db.add(ApplicationDocument(application_id=application.id, document_id=document_id))
    purpose = (
        application.service.name
        if application.service.name.lower().endswith("application")
        else f"{application.service.name} Application"
    )
    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    if consent is None:
        consent = Consent(
            user_id=application.user_id,
            application_id=application.id,
            service_id=application.service_id,
            data_categories=data_categories,
            document_types=document_types,
            document_ids=document_ids,
            purpose=purpose,
            status=ConsentStatus.GRANTED,
            granted_at=datetime.now(UTC),
        )
        db.add(consent)
    else:
        consent.data_categories = data_categories
        consent.document_types = document_types
        consent.document_ids = document_ids
        consent.purpose = purpose
        consent.status = ConsentStatus.GRANTED
        consent.granted_at = datetime.now(UTC)
    application.status = ApplicationStatus.READY_FOR_REVIEW
    db.commit()
    db.refresh(consent)
    return consent
