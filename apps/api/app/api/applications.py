from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.application import (
    AdditionalDataUpdate,
    ApplicationEngineResponse,
    ApplicationPreviewResponse,
    ApplicationSnapshotResponse,
)
from app.schemas.payment import PaymentProcessResponse, SubmissionResponse
from app.services import application_engine, payment_submission_service, preview_service
from app.services.service_catalog import ServiceNotFoundError

router = APIRouter(tags=["applications"])


@router.post(
    "/services/{service_id}/applications",
    response_model=ApplicationEngineResponse,
    status_code=status.HTTP_201_CREATED,
)
def apply_to_service(service_id: str, db: Session = Depends(get_db)) -> ApplicationEngineResponse:
    try:
        return application_engine.create_application(db, service_id)
    except ServiceNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "SERVICE_NOT_FOUND", "message": f"Service '{service_id}' was not found."},
        ) from error


@router.put("/applications/{application_id}/additional-data", response_model=ApplicationEngineResponse)
def update_additional_data(
    application_id: str,
    payload: AdditionalDataUpdate,
    db: Session = Depends(get_db),
) -> ApplicationEngineResponse:
    try:
        return application_engine.save_additional_data(db, application_id, payload)
    except application_engine.ApplicationNotFoundError as error:
        raise application_not_found(application_id) from error
    except application_engine.InvalidApplicationFieldsError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "INVALID_APPLICATION_FIELDS", "fields": error.fields},
        ) from error


@router.get("/applications/{application_id}", response_model=ApplicationEngineResponse)
def read_application(application_id: str, db: Session = Depends(get_db)) -> ApplicationEngineResponse:
    try:
        return application_engine.build_engine_response(db, application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise application_not_found(application_id) from error


@router.delete("/applications/{application_id}")
def delete_draft_application(application_id: str, db: Session = Depends(get_db)) -> dict[str, str]:
    try:
        application_engine.delete_draft_application(db, application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise application_not_found(application_id) from error
    except application_engine.ApplicationDeletionNotAllowedError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "APPLICATION_NOT_DRAFT", "message": "Only draft applications can be deleted."},
        ) from error
    return {"id": application_id}


@router.get("/applications/{application_id}/preview", response_model=ApplicationPreviewResponse)
def read_application_preview(
    application_id: str, db: Session = Depends(get_db)
) -> ApplicationPreviewResponse:
    try:
        return preview_service.get_preview(db, application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise application_not_found(application_id) from error


@router.post(
    "/applications/{application_id}/finalize",
    response_model=ApplicationSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
)
def finalize_application(
    application_id: str, db: Session = Depends(get_db)
) -> ApplicationSnapshotResponse:
    try:
        return preview_service.finalize_application(db, application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise application_not_found(application_id) from error
    except preview_service.ConsentRequiredForFinalizationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "CONSENT_REQUIRED"},
        ) from error
    except preview_service.ApplicationNotReadyForFinalizationError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "APPLICATION_NOT_READY",
                "missing_profile_fields": error.missing_profile_fields,
                "missing_fields": error.missing_fields,
            },
        ) from error


@router.post("/applications/{application_id}/payment", response_model=PaymentProcessResponse)
def process_application_payment(
    application_id: str, db: Session = Depends(get_db)
) -> PaymentProcessResponse:
    try:
        return payment_submission_service.process_payment(db, application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise application_not_found(application_id) from error
    except payment_submission_service.ApplicationSnapshotRequiredError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "APPLICATION_SNAPSHOT_REQUIRED"},
        ) from error


@router.post("/applications/{application_id}/submit", response_model=SubmissionResponse)
def submit_application(application_id: str, db: Session = Depends(get_db)) -> SubmissionResponse:
    try:
        return payment_submission_service.submit_application(db, application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise application_not_found(application_id) from error
    except payment_submission_service.ApplicationSnapshotRequiredError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "APPLICATION_SNAPSHOT_REQUIRED"},
        ) from error
    except payment_submission_service.SuccessfulPaymentRequiredError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": "SUCCESSFUL_PAYMENT_REQUIRED"},
        ) from error
def application_not_found(application_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "APPLICATION_NOT_FOUND", "message": f"Application '{application_id}' was not found."},
    )
