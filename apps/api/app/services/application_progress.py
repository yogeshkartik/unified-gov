from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import ApplicationSnapshot
from app.models.consent import Consent, ConsentStatus
from app.models.payment import Payment, PaymentStatus
from app.models.profile import DocumentSource, DocumentType
from app.schemas.application_progress import (
    ApplicationFieldProgress, ApplicationProgress, ApplicationQuestion, ConsentProgress, DocumentProgress,
    PaymentProgress, ProfileProgress, ProgressDocument, ProgressField, ProgressService, QuestionField,
)
from app.services import application_engine


FINAL_STATUSES = {"SUBMITTED", "PROCESSING", "COMPLETED", "REJECTED", "CANCELLED"}
QUESTION_TYPES = {
    "text": "TEXT_QUESTION",
    "textarea": "TEXTAREA_QUESTION",
    "select": "SELECT_QUESTION",
    "radio": "SELECT_QUESTION",
    "checkbox": "BOOLEAN_QUESTION",
    "number": "NUMBER_QUESTION",
}


def get_application_progress(db: Session, application_id: str) -> ApplicationProgress:
    """Calculate progress from current persisted state; callers never infer readiness."""
    application = application_engine.get_application(db, application_id)
    missing_profile, _, missing_field_keys = application_engine.determine_missing_requirements(db, application)
    required_profile = application.service.required_profile_fields
    profile = ProfileProgress(
        satisfied=[field for field in required_profile if field not in missing_profile],
        missing=missing_profile,
    )

    answers = application.answers_by_key
    field_items = [
        ProgressField(
            key=field.key, label=field.label, field_type=str(field.field_type),
            required=field.required, options=field.options,
            value=answers.get(field.key) if field.key in answers else None,
        )
        for field in application_engine.active_service_fields(application.service.fields, answers) if field.required
    ]
    fields = ApplicationFieldProgress(
        satisfied=[field for field in field_items if field.key not in missing_field_keys],
        missing=[field for field in field_items if field.key in missing_field_keys],
    )

    attached = [item.document for item in application.documents if item.document is not None]
    profile_photos = [
        document for document in application.user.documents
        if document.source == DocumentSource.PROFILE_UPLOAD
        and document.document_type in {DocumentType.PHOTOGRAPH, DocumentType.PROFILE_PHOTO}
    ]
    available = list({document.id: document for document in profile_photos + attached}.values())
    satisfied_documents: list[ProgressDocument] = []
    missing_documents: list[ProgressDocument] = []
    for requirement in application.service.document_requirements:
        if not requirement.required:
            continue
        document = next((item for item in available if application_engine.document_type_matches(requirement.document_type, item.document_type)), None)
        progress_document = ProgressDocument(
            requirement_id=requirement.id, document_type=requirement.document_type,
            label=requirement.label, required=requirement.required,
            document_id=document.id if document else None,
        )
        (satisfied_documents if document else missing_documents).append(progress_document)
    documents = DocumentProgress(satisfied=satisfied_documents, missing=missing_documents)

    consent_record = db.scalar(select(Consent).where(Consent.application_id == application.id))
    consent_granted = consent_record is not None and consent_record.status == ConsentStatus.GRANTED
    consent = ConsentProgress(
        granted=consent_granted,
        status=str(consent_record.status) if consent_record is not None else "PENDING",
    )
    successful_payment = db.scalar(select(Payment).where(Payment.application_id == application.id, Payment.status == PaymentStatus.SUCCESS))
    failed_payment = db.scalar(select(Payment).where(Payment.application_id == application.id, Payment.status == PaymentStatus.FAILED))
    payment_required = float(application.service.fee) > 0
    payment_status = "NOT_REQUIRED" if not payment_required else "COMPLETED" if successful_payment else "FAILED" if failed_payment else "PENDING"
    payment = PaymentProgress(required=payment_required, amount=float(application.service.fee), currency=application.service.currency, status=payment_status)

    requirements_complete = not profile.missing and not fields.missing and not documents.missing
    ready_for_consent = requirements_complete
    ready_for_review = requirements_complete and consent_granted
    has_snapshot = db.scalar(select(ApplicationSnapshot.id).where(ApplicationSnapshot.application_id == application.id)) is not None
    ready_for_payment = ready_for_review and has_snapshot
    ready_for_submission = ready_for_payment and (not payment_required or successful_payment is not None)
    status = str(application.status)
    if status in FINAL_STATUSES:
        next_stage = "COMPLETE"
    elif profile.missing:
        next_stage = "PROFILE"
    elif fields.missing:
        next_stage = "ADDITIONAL_INFORMATION"
    elif documents.missing:
        next_stage = "DOCUMENTS"
    elif not consent_granted:
        next_stage = "CONSENT"
    elif not has_snapshot:
        next_stage = "REVIEW"
    elif payment_required and successful_payment is None:
        next_stage = "PAYMENT"
    else:
        next_stage = "SUBMISSION"
    return ApplicationProgress(
        application_id=application.id,
        service=ProgressService(id=application.service.id, name=application.service.name, department=application.service.department),
        status=status, profile=profile, application_fields=fields, documents=documents,
        consent=consent, payment=payment,
        submission_status=status if status in FINAL_STATUSES else "NOT_READY" if not ready_for_submission else "READY",
        ready_for_review=ready_for_review, ready_for_consent=ready_for_consent,
        ready_for_payment=ready_for_payment, ready_for_submission=ready_for_submission,
        next_stage=next_stage,
    )


def get_next_application_question(db: Session, application_id: str) -> ApplicationQuestion | None:
    """Return only the first backend-ordered active missing service field."""
    application = application_engine.get_application(db, application_id)
    if application.status not in application_engine.EDITABLE_STATUSES:
        return None
    progress = get_application_progress(db, application_id)
    if not progress.application_fields.missing:
        return None
    missing = progress.application_fields.missing[0]
    source = next(field for field in application.service.fields if field.key == missing.key)
    question_type = QUESTION_TYPES.get(missing.field_type)
    if question_type is None:
        return None
    return ApplicationQuestion(
        type=question_type,
        application_id=application.id,
        field=QuestionField(
            key=source.key,
            label=source.label,
            field_type=str(source.field_type),
            required=source.required,
            options=source.options,
            help_text=source.help_text,
        ),
    )
