from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consent import Consent, ConsentStatus
from app.models.profile import Document
from app.services import application_engine


class ConsentAdditionalDataRequiredError(Exception):
    def __init__(self, missing_fields: list[str]) -> None:
        self.missing_fields = missing_fields
        super().__init__("Additional application data is required before consent.")


def grant_consent(db: Session, application_id: str) -> Consent:
    application = application_engine.get_application(db, application_id)
    _, _, missing_fields = application_engine.determine_missing_requirements(db, application)
    if missing_fields:
        raise ConsentAdditionalDataRequiredError(missing_fields)

    data_categories = [
        *application.service.required_profile_fields,
        *(field.key for field in application.service.fields),
    ]
    document_types = [
        requirement.document_type for requirement in application.service.document_requirements
    ]
    citizen_documents = list(
        db.scalars(select(Document).where(Document.user_id == application.user_id)).all()
    )
    document_ids = [
        document.id
        for document in citizen_documents
        if any(
            application_engine.document_type_matches(required_type, document.document_type)
            for required_type in document_types
        )
    ]
    consent = db.scalar(select(Consent).where(Consent.application_id == application.id))
    if consent is None:
        consent = Consent(
            user_id=application.user_id,
            application_id=application.id,
            service_id=application.service_id,
            data_categories=data_categories,
            document_types=document_types,
            document_ids=document_ids,
            purpose=f"{application.service.name} Application",
            status=ConsentStatus.GRANTED,
            granted_at=datetime.now(UTC),
        )
        db.add(consent)
    else:
        consent.data_categories = data_categories
        consent.document_types = document_types
        consent.document_ids = document_ids
        consent.status = ConsentStatus.GRANTED
        consent.granted_at = datetime.now(UTC)
    db.commit()
    db.refresh(consent)
    return consent
