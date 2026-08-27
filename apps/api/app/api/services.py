from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.service import ServiceDetailResponse, ServiceRequirementsResponse, ServiceResponse
from app.services import service_catalog

router = APIRouter(tags=["services"])


def service_not_found(service_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "SERVICE_NOT_FOUND", "message": f"Service '{service_id}' was not found."},
    )


@router.get("/services", response_model=list[ServiceResponse])
def read_services(db: Session = Depends(get_db)) -> list[ServiceResponse]:
    return service_catalog.list_services(db)


@router.get("/services/{service_id}", response_model=ServiceDetailResponse)
def read_service(service_id: str, db: Session = Depends(get_db)) -> ServiceDetailResponse:
    try:
        return service_catalog.get_service(db, service_id)
    except service_catalog.ServiceNotFoundError as error:
        raise service_not_found(service_id) from error


@router.get("/services/{service_id}/requirements", response_model=ServiceRequirementsResponse)
def read_service_requirements(service_id: str, db: Session = Depends(get_db)) -> ServiceRequirementsResponse:
    try:
        service = service_catalog.get_service(db, service_id)
    except service_catalog.ServiceNotFoundError as error:
        raise service_not_found(service_id) from error
    return ServiceRequirementsResponse(
        service_id=service.id,
        required_profile_fields=service.required_profile_fields,
        fields=service.fields,
        document_requirements=service.document_requirements,
    )
