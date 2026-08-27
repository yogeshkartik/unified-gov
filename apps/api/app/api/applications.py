from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.application import AdditionalDataUpdate, ApplicationEngineResponse
from app.services import application_engine
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


def application_not_found(application_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "APPLICATION_NOT_FOUND", "message": f"Application '{application_id}' was not found."},
    )
