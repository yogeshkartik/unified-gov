from typing import NoReturn

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.integrations.digilocker.mock import ProviderDocumentNotFoundError
from app.models.profile import Document
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.application_review import (
    ApplicationReviewRequest,
    ApplicationReviewResponse,
    GrantChatConsentRequest,
    GrantChatConsentResponse,
)
from app.schemas.chat_transaction import (
    PayApplicationResponse,
    SubmitApplicationRequest,
    SubmitApplicationResponse,
    TransactionComponentsResponse,
    TransactionRequest,
)
from app.schemas.application_progress import (
    ApplicationProgress,
    ApplicationDocumentActionRequest,
    ApplicationDocumentActionResponse,
    DocumentRequest,
    ListApplicationDocumentsRequest,
    SetApplicationFieldRequest,
    SetApplicationFieldResponse,
    StartApplicationRequest,
    StartApplicationResponse,
)
from app.services import (
    application_document_service,
    application_engine,
    application_progress,
    application_review_service,
    consent_service,
    chat_transaction_service,
    digilocker_service,
    payment_submission_service,
    profile_service,
)
from app.services.service_catalog import ServiceNotFoundError
from app.services.chat_service import ChatProviderError, ChatRateLimitError, chat

router = APIRouter(tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
def send_chat_message(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    try:
        return chat(db, payload)
    except ChatRateLimitError as error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "CHAT_RATE_LIMITED", "message": "The assistant is temporarily busy. Please try again shortly."},
        ) from error
    except ChatProviderError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail={"code": "CHAT_UNAVAILABLE"}) from error


def _incomplete_detail(error: Exception) -> dict[str, object]:
    return {
        "code": "APPLICATION_INCOMPLETE",
        "message": "Complete the missing application requirements before continuing.",
        "missing_profile_fields": getattr(error, "missing_profile_fields", []),
        "missing_documents": getattr(error, "missing_documents", []),
        "missing_fields": getattr(error, "missing_fields", []),
    }


@router.post(
    "/chat/actions/get-application-review",
    response_model=ApplicationReviewResponse,
)
def get_application_review(
    payload: ApplicationReviewRequest, db: Session = Depends(get_db)
) -> ApplicationReviewResponse:
    try:
        return application_review_service.get_application_review(
            db, payload.application_id
        )
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(404, detail={"code": "APPLICATION_NOT_FOUND"}) from error
    except application_review_service.ApplicationNotReadyForReviewError as error:
        raise HTTPException(409, detail=_incomplete_detail(error)) from error
    except application_review_service.ApplicationReviewUnavailableError as error:
        raise HTTPException(
            409, detail={"code": "APPLICATION_REVIEW_UNAVAILABLE"}
        ) from error


@router.post(
    "/chat/actions/get-application-progress",
    response_model=ApplicationProgress,
)
def get_chat_application_progress(
    payload: ApplicationReviewRequest, db: Session = Depends(get_db)
) -> ApplicationProgress:
    try:
        return application_progress.get_application_progress(db, payload.application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(404, detail={"code": "APPLICATION_NOT_FOUND"}) from error


@router.post(
    "/chat/actions/get-next-transaction",
    response_model=TransactionComponentsResponse,
)
def get_next_transaction(
    payload: TransactionRequest, db: Session = Depends(get_db)
) -> TransactionComponentsResponse:
    try:
        return chat_transaction_service.get_transaction_components(
            db, payload.application_id
        )
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(404, detail={"code": "APPLICATION_NOT_FOUND"}) from error


def _raise_transaction_error(error: Exception) -> NoReturn:
    if isinstance(error, application_engine.ApplicationNotFoundError):
        raise HTTPException(404, detail={"code": "APPLICATION_NOT_FOUND"}) from error
    if isinstance(error, payment_submission_service.ApplicationIncompleteForTransactionError):
        raise HTTPException(409, detail=_incomplete_detail(error)) from error
    if isinstance(error, payment_submission_service.ConsentRequiredForTransactionError):
        raise HTTPException(409, detail={"code": "CONSENT_REQUIRED"}) from error
    if isinstance(error, payment_submission_service.PaymentNotRequiredError):
        raise HTTPException(409, detail={"code": "PAYMENT_NOT_REQUIRED"}) from error
    if isinstance(error, payment_submission_service.SuccessfulPaymentRequiredError):
        raise HTTPException(409, detail={"code": "SUCCESSFUL_PAYMENT_REQUIRED"}) from error
    if isinstance(error, payment_submission_service.InvalidTransactionStageError):
        raise HTTPException(409, detail={"code": "INVALID_APPLICATION_STAGE"}) from error
    if isinstance(error, payment_submission_service.TerminalApplicationTransactionError):
        raise HTTPException(409, detail={"code": "APPLICATION_TERMINAL"}) from error
    raise error


@router.post("/chat/actions/pay", response_model=PayApplicationResponse)
def pay_application(
    payload: TransactionRequest, db: Session = Depends(get_db)
) -> PayApplicationResponse:
    try:
        progress_before = application_progress.get_application_progress(
            db, payload.application_id
        )
        if not progress_before.payment.required:
            raise payment_submission_service.PaymentNotRequiredError
        payment = payment_submission_service.process_payment(db, payload.application_id)
        progress = application_progress.get_application_progress(db, payload.application_id)
        return PayApplicationResponse(
            payment=payment,
            payment_card=chat_transaction_service.payment_card(
                db, payload.application_id, payment
            ),
            progress=progress,
            submission_confirmation=(
                chat_transaction_service.submission_confirmation(
                    db, payload.application_id
                )
                if progress.next_stage == "SUBMISSION"
                else None
            ),
        )
    except Exception as error:
        _raise_transaction_error(error)


@router.post(
    "/chat/actions/submit-application",
    response_model=SubmitApplicationResponse,
)
def submit_chat_application(
    payload: SubmitApplicationRequest, db: Session = Depends(get_db)
) -> SubmitApplicationResponse:
    try:
        submission = payment_submission_service.submit_application(
            db, payload.application_id
        )
        return SubmitApplicationResponse(
            progress=application_progress.get_application_progress(
                db, payload.application_id
            ),
            success=chat_transaction_service.submission_success(
                db, payload.application_id, submission
            ),
        )
    except Exception as error:
        _raise_transaction_error(error)


@router.post(
    "/chat/actions/grant-consent",
    response_model=GrantChatConsentResponse,
)
def grant_chat_consent(
    payload: GrantChatConsentRequest, db: Session = Depends(get_db)
) -> GrantChatConsentResponse:
    try:
        consent_service.grant_consent(db, payload.application_id)
        review = application_review_service.get_application_review(
            db, payload.application_id
        ).review
        return GrantChatConsentResponse(
            progress=application_progress.get_application_progress(
                db, payload.application_id
            ),
            review=review,
        )
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(404, detail={"code": "APPLICATION_NOT_FOUND"}) from error
    except consent_service.ApplicationIncompleteForConsentError as error:
        raise HTTPException(409, detail=_incomplete_detail(error)) from error
    except consent_service.ApplicationNotEligibleForConsentError as error:
        raise HTTPException(
            409,
            detail={
                "code": "APPLICATION_NOT_ELIGIBLE_FOR_CONSENT",
                "message": "This application cannot receive consent in its current stage.",
            },
        ) from error
    except application_review_service.ApplicationReviewUnavailableError as error:
        raise HTTPException(
            409, detail={"code": "APPLICATION_REVIEW_UNAVAILABLE"}
        ) from error


@router.post("/chat/actions/start-application", response_model=StartApplicationResponse)
def start_application(payload: StartApplicationRequest, db: Session = Depends(get_db)) -> StartApplicationResponse:
    try:
        result, application = application_engine.create_or_resume_application(db, payload.service_id)
        return StartApplicationResponse(
            result=result,
            application_id=application.id,
            progress=application_progress.get_application_progress(db, application.id),
            next_question=application_progress.get_next_application_question(db, application.id),
            next_document=application_document_service.get_next_document_request(db, application.id),
        )
    except ServiceNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "SERVICE_NOT_FOUND"}) from error
    except application_engine.ServiceNotAvailableError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "SERVICE_NOT_AVAILABLE"}) from error
    except application_engine.ServiceJurisdictionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "SERVICE_JURISDICTION_MISMATCH"}) from error


@router.post("/chat/actions/set-application-field", response_model=SetApplicationFieldResponse)
def set_application_field(payload: SetApplicationFieldRequest, db: Session = Depends(get_db)) -> SetApplicationFieldResponse:
    try:
        saved_value, application = application_engine.set_application_field(
            db, payload.application_id, payload.field_key, payload.value
        )
        return SetApplicationFieldResponse(
            saved_field_key=payload.field_key,
            saved_value=saved_value,
            progress=application_progress.get_application_progress(db, application.id),
            next_question=application_progress.get_next_application_question(db, application.id),
            next_document=application_document_service.get_next_document_request(db, application.id),
        )
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "APPLICATION_NOT_FOUND"}) from error
    except application_engine.ApplicationFieldNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail={"code": "FIELD_NOT_FOUND"}) from error
    except application_engine.ApplicationFieldNotApplicableError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "FIELD_NOT_APPLICABLE"}) from error
    except application_engine.ApplicationNotEditableError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail={"code": "APPLICATION_NOT_EDITABLE"}) from error
    except application_engine.InvalidApplicationFieldsError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "INVALID_APPLICATION_FIELD", "fields": error.fields},
        ) from error


@router.post("/chat/actions/list-available-documents", response_model=DocumentRequest | None)
def list_available_documents(
    payload: ListApplicationDocumentsRequest, db: Session = Depends(get_db)
) -> DocumentRequest | None:
    try:
        return application_document_service.get_next_document_request(db, payload.application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(404, detail={"code": "APPLICATION_NOT_FOUND"}) from error


def _document_action_response(
    db: Session, application_id: str, document: Document
) -> ApplicationDocumentActionResponse:
    return ApplicationDocumentActionResponse(
        attached_document=application_document_service.document_choice(document),
        progress=application_progress.get_application_progress(db, application_id),
        next_document=application_document_service.get_next_document_request(db, application_id),
    )


def _raise_document_action_error(error: Exception) -> NoReturn:
    if isinstance(error, application_engine.ApplicationNotFoundError):
        raise HTTPException(404, detail={"code": "APPLICATION_NOT_FOUND"}) from error
    if isinstance(error, application_document_service.ApplicationDocumentNotFoundError):
        raise HTTPException(404, detail={"code": "DOCUMENT_NOT_FOUND"}) from error
    if isinstance(error, ProviderDocumentNotFoundError):
        raise HTTPException(404, detail={"code": "DIGILOCKER_DOCUMENT_NOT_FOUND"}) from error
    if isinstance(error, application_document_service.ApplicationDocumentRequirementNotFoundError):
        raise HTTPException(422, detail={"code": "APPLICATION_REQUIREMENT_NOT_FOUND"}) from error
    if isinstance(error, application_document_service.IncompatibleApplicationDocumentError):
        raise HTTPException(422, detail={"code": "INCOMPATIBLE_DOCUMENT"}) from error
    if isinstance(error, application_document_service.UnsupportedApplicationDocumentRequirementError):
        raise HTTPException(422, detail={"code": "UNSUPPORTED_DOCUMENT_REQUIREMENT"}) from error
    if isinstance(error, application_document_service.ApplicationDocumentRequirementNotApplicableError):
        raise HTTPException(409, detail={"code": "DOCUMENT_REQUIREMENT_NOT_APPLICABLE"}) from error
    if isinstance(error, application_engine.ApplicationNotEditableError):
        raise HTTPException(409, detail={"code": "APPLICATION_NOT_EDITABLE"}) from error
    if isinstance(error, profile_service.InvalidDocumentError):
        raise HTTPException(
            422, detail={"code": error.code, "message": error.message}
        ) from error
    raise error


@router.post("/chat/actions/attach-document", response_model=ApplicationDocumentActionResponse)
def attach_document(
    payload: ApplicationDocumentActionRequest, db: Session = Depends(get_db)
) -> ApplicationDocumentActionResponse:
    try:
        document = application_document_service.attach_document(
            db,
            payload.application_id,
            payload.requirement_id,
            payload.document_id,
        )
        return _document_action_response(db, payload.application_id, document)
    except Exception as error:
        _raise_document_action_error(error)


@router.post(
    "/chat/actions/import-digilocker-document",
    response_model=ApplicationDocumentActionResponse,
)
def import_digilocker_document(
    payload: ApplicationDocumentActionRequest, db: Session = Depends(get_db)
) -> ApplicationDocumentActionResponse:
    try:
        document = digilocker_service.import_and_attach_document(
            db,
            payload.application_id,
            payload.requirement_id,
            payload.document_id,
        )
        return _document_action_response(db, payload.application_id, document)
    except Exception as error:
        _raise_document_action_error(error)


@router.post(
    "/chat/actions/upload-document",
    response_model=ApplicationDocumentActionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    application_id: str = Form(...),
    requirement_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ApplicationDocumentActionResponse:
    try:
        document = await application_document_service.upload_and_attach_document(
            db, application_id, requirement_id, file, require_current=True
        )
        return _document_action_response(db, application_id, document)
    except Exception as error:
        _raise_document_action_error(error)
