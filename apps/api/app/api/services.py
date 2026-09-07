from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.service import RecommendedServiceResponse, ServiceDetailResponse, ServiceRequirementsResponse, ServiceResponse
from app.services import recommendations, service_catalog

router = APIRouter(tags=["services"])


def service_not_found(service_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "SERVICE_NOT_FOUND", "message": f"Service '{service_id}' was not found."},
    )


@router.get("/services/recommended", response_model=list[RecommendedServiceResponse])
def read_recommended_services(db: Session = Depends(get_db)) -> list[RecommendedServiceResponse]:
    try:
        return [
            RecommendedServiceResponse(service=ServiceResponse.model_validate(item.service), recommendation_status="RECOMMENDED", reasons=item.reasons)
            for item in recommendations.recommend_services(db)
        ]
    except Exception as error:
        from app.services.profile_service import ProfileNotFoundError
        if isinstance(error, ProfileNotFoundError):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error
        raise


@router.get("/services", response_model=list[ServiceResponse])
def read_services(
    state: str | None = Query(default=None, min_length=2, max_length=2),
    include_all_supported_states: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[ServiceResponse]:
    try:
        return service_catalog.list_services(db, state, include_all_supported_states=include_all_supported_states)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail={"code": "INVALID_STATE", "message": str(error)}) from error


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
