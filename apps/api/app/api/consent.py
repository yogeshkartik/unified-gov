from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.consent import ConsentResponse
from app.services import application_engine, consent_service

router = APIRouter(tags=["consent"])


@router.post(
    "/applications/{application_id}/consent",
    response_model=ConsentResponse,
    status_code=status.HTTP_201_CREATED,
)
def grant_application_consent(
    application_id: str, db: Session = Depends(get_db)
) -> ConsentResponse:
    try:
        return consent_service.grant_consent(db, application_id)
    except application_engine.ApplicationNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "APPLICATION_NOT_FOUND", "message": f"Application '{application_id}' was not found."},
        ) from error
    except consent_service.ApplicationIncompleteForConsentError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "APPLICATION_INCOMPLETE",
                "missing_profile_fields": error.missing_profile_fields,
                "missing_documents": error.missing_documents,
                "missing_fields": error.missing_fields,
            },
        ) from error
