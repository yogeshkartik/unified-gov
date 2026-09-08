from __future__ import annotations

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import Application, ApplicationDocument
from app.models.profile import Document, DocumentSource, DocumentType
from app.models.service import ServiceDocumentRequirement
from app.schemas.application_progress import (
    AvailableDigiLockerDocument,
    AvailableDocument,
    DocumentRequest,
    DocumentRequirement,
)
from app.services import application_engine, application_progress, profile_service


class ApplicationDocumentNotFoundError(Exception):
    pass


class ApplicationDocumentRequirementNotFoundError(Exception):
    pass


class ApplicationDocumentRequirementNotApplicableError(Exception):
    pass


class IncompatibleApplicationDocumentError(Exception):
    pass


class UnsupportedApplicationDocumentRequirementError(Exception):
    pass


def require_editable_application(application: Application) -> None:
    if application.status not in application_engine.EDITABLE_STATUSES:
        raise application_engine.ApplicationNotEditableError


def requirement_for_application(
    application: Application, requirement_id: str
) -> ServiceDocumentRequirement:
    requirement = next(
        (item for item in application.service.document_requirements if item.id == requirement_id),
        None,
    )
    if requirement is None:
        raise ApplicationDocumentRequirementNotFoundError
    # The current schema has no conditional/active flag. Required requirements are
    # the complete set of active requirements that can block an application.
    if not requirement.required:
        raise ApplicationDocumentRequirementNotApplicableError
    return requirement


def document_choice(document: Document) -> AvailableDocument:
    return AvailableDocument(
        document_id=document.id,
        name=document.display_name or document.name,
        document_type=str(document.document_type),
        source=str(document.source),
    )


def get_next_document_request(db: Session, application_id: str) -> DocumentRequest | None:
    """Return candidates only for the first canonical missing requirement."""
    application = application_engine.get_application(db, application_id)
    if application.status not in application_engine.EDITABLE_STATUSES:
        return None
    progress = application_progress.get_application_progress(db, application_id)
    if progress.profile.missing or progress.application_fields.missing or not progress.documents.missing:
        return None

    missing = progress.documents.missing[0]
    requirement = requirement_for_application(application, missing.requirement_id)
    documents = list(
        db.scalars(
            select(Document)
            .where(
                Document.user_id == application.user_id,
                Document.source == DocumentSource.PROFILE_UPLOAD,
            )
            .order_by(Document.name)
        ).all()
    )
    existing = [
        document_choice(document)
        for document in documents
        if application_engine.document_type_matches(requirement.document_type, document.document_type)
    ]

    from app.services import digilocker_service

    provider_documents = [
        AvailableDigiLockerDocument(
            document_id=document.id,
            name=document.name,
            document_type=document.document_type,
            issuer=document.issuer,
        )
        for document in digilocker_service.get_documents(application.user_id)
        if application_engine.document_type_matches(requirement.document_type, document.document_type)
    ]
    try:
        DocumentType(requirement.document_type)
        upload_allowed = True
    except ValueError:
        upload_allowed = False

    return DocumentRequest(
        application_id=application.id,
        requirement=DocumentRequirement(
            id=requirement.id,
            label=requirement.label,
            document_type=requirement.document_type,
            required=requirement.required,
        ),
        existing_documents=existing,
        digilocker_options=provider_documents,
        upload_allowed=upload_allowed,
    )


def validate_specific_attachment(
    db: Session,
    application: Application,
    requirement: ServiceDocumentRequirement,
    document: Document,
    *,
    require_current: bool = True,
) -> None:
    if not application_engine.document_type_matches(requirement.document_type, document.document_type):
        raise IncompatibleApplicationDocumentError

    attached_ids = {item.document_id for item in application.documents}
    if document.id in attached_ids:
        return

    if require_current:
        progress = application_progress.get_application_progress(db, application.id)
        next_missing_id = progress.documents.missing[0].requirement_id if progress.documents.missing else None
        if next_missing_id != requirement.id:
            raise ApplicationDocumentRequirementNotApplicableError


def attach_document(
    db: Session,
    application_id: str,
    requirement_id: str,
    document_id: str,
    *,
    commit: bool = True,
    require_current: bool = True,
) -> Document:
    """Attach one owned My Documents item to one canonical active requirement."""
    application = application_engine.get_application(db, application_id)
    require_editable_application(application)
    requirement = requirement_for_application(application, requirement_id)
    document = db.scalar(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == application.user_id,
            Document.source == DocumentSource.PROFILE_UPLOAD,
        )
    )
    if document is None:
        raise ApplicationDocumentNotFoundError
    validate_specific_attachment(
        db, application, requirement, document, require_current=require_current
    )

    if document.id not in {item.document_id for item in application.documents}:
        db.add(ApplicationDocument(application_id=application.id, document_id=document.id))
    if commit:
        db.commit()
    else:
        db.flush()
    return document


def attach_my_documents(
    db: Session, application_id: str, document_ids: list[str], *, commit: bool = True
) -> list[Document]:
    """Attach reusable uploads through the normal flow using the shared rules."""
    application = application_engine.get_application(db, application_id)
    require_editable_application(application)
    unique_ids = set(document_ids)
    documents = list(
        db.scalars(
            select(Document).where(
                Document.id.in_(unique_ids),
                Document.user_id == application.user_id,
                Document.source == DocumentSource.PROFILE_UPLOAD,
            )
        ).all()
    )
    if len(documents) != len(unique_ids):
        raise ApplicationDocumentNotFoundError

    required_types = [
        item.document_type for item in application.service.document_requirements if item.required
    ]
    if any(
        not any(application_engine.document_type_matches(required, document.document_type) for required in required_types)
        for document in documents
    ):
        raise IncompatibleApplicationDocumentError

    attached_ids = {item.document_id for item in application.documents}
    for document in documents:
        if document.id not in attached_ids:
            db.add(ApplicationDocument(application_id=application.id, document_id=document.id))
    if commit:
        db.commit()
    else:
        db.flush()
    return documents


async def upload_and_attach_document(
    db: Session,
    application_id: str,
    requirement_id: str,
    upload: UploadFile,
    *,
    require_current: bool = False,
) -> Document:
    """Persist a reusable upload and its application link as one database unit."""
    application = application_engine.get_application(db, application_id)
    require_editable_application(application)
    requirement = requirement_for_application(application, requirement_id)
    if require_current:
        progress = application_progress.get_application_progress(db, application.id)
        next_missing_id = progress.documents.missing[0].requirement_id if progress.documents.missing else None
        if next_missing_id != requirement.id:
            raise ApplicationDocumentRequirementNotApplicableError
    try:
        document_type = DocumentType(requirement.document_type)
    except ValueError as error:
        raise UnsupportedApplicationDocumentRequirementError from error

    document: Document | None = None
    try:
        document = await profile_service.save_upload(
            db,
            upload,
            document_type,
            requirement.label if document_type == DocumentType.OTHER else None,
            commit=False,
        )
        attach_document(
            db,
            application.id,
            requirement.id,
            document.id,
            commit=False,
            require_current=require_current,
        )
        db.commit()
        replaced_stored_filename = getattr(document, "_replaced_stored_filename", None)
        if replaced_stored_filename:
            profile_service._delete_file(replaced_stored_filename)
        db.refresh(document)
        return document
    except Exception:
        db.rollback()
        if document is not None:
            profile_service._delete_file(document.stored_filename)
        raise


__all__ = [
    "ApplicationDocumentNotFoundError",
    "ApplicationDocumentRequirementNotApplicableError",
    "ApplicationDocumentRequirementNotFoundError",
    "IncompatibleApplicationDocumentError",
    "UnsupportedApplicationDocumentRequirementError",
    "attach_document",
    "attach_my_documents",
    "document_choice",
    "get_next_document_request",
    "require_editable_application",
    "requirement_for_application",
    "upload_and_attach_document",
    "validate_specific_attachment",
]
