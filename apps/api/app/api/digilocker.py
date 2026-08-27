from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.integrations.digilocker.mock import ProviderDocumentNotFoundError
from app.schemas.application import ApplicationDocumentSelection
from app.schemas.digilocker import (
    DigiLockerConsentRequest,
    DigiLockerConsentResponse,
    DigiLockerDocumentResponse,
)
from app.schemas.profile import DocumentResponse
from app.services import application_engine, digilocker_service
from app.services.profile_service import ProfileNotFoundError, get_demo_user

router = APIRouter(tags=["digilocker"])


@router.get("/digilocker/documents", response_model=list[DigiLockerDocumentResponse])
def read_digilocker_documents(db: Session = Depends(get_db)) -> list[DigiLockerDocumentResponse]:
    try:
        user = get_demo_user(db)
        return digilocker_service.get_documents(user.id)
    except ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error


@router.get("/digilocker/documents/{document_id}", response_model=DigiLockerDocumentResponse)
def read_digilocker_document(document_id: str) -> DigiLockerDocumentResponse:
    try:
        return digilocker_service.get_document(document_id)
    except ProviderDocumentNotFoundError as error:
        raise digilocker_document_not_found(document_id) from error


@router.post("/digilocker/consent", response_model=DigiLockerConsentResponse)
def request_digilocker_consent(
    payload: DigiLockerConsentRequest, db: Session = Depends(get_db)
) -> DigiLockerConsentResponse:
    try:
        user = get_demo_user(db)
        return digilocker_service.request_consent(user.id, payload.document_ids)
    except ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error
    except ProviderDocumentNotFoundError as error:
        raise digilocker_document_not_found(str(error)) from error


@router.post(
    "/applications/{application_id}/documents",
    response_model=list[DocumentResponse],
    status_code=status.HTTP_201_CREATED,
)
def select_digilocker_documents(
    application_id: str,
    payload: ApplicationDocumentSelection,
    db: Session = Depends(get_db),
) -> list[DocumentResponse]:
    try:
        return digilocker_service.select_application_documents(db, application_id, payload.document_ids)
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "APPLICATION_NOT_FOUND"},
        ) from error
    except ProviderDocumentNotFoundError as error:
        raise digilocker_document_not_found(str(error)) from error


def digilocker_document_not_found(document_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "DIGILOCKER_DOCUMENT_NOT_FOUND", "message": f"DigiLocker document '{document_id}' was not found."},
    )
