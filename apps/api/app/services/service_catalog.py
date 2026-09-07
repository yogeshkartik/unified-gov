from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.service import GovernmentLevel, Service, ServiceStatus

SUPPORTED_STATE_CODES = frozenset({"BR", "KA", "MH", "TN", "UP", "WB"})


class ServiceNotFoundError(Exception):
    pass


def list_services(db: Session, state_code: str | None = None) -> list[Service]:
    query = select(Service).where(Service.status == ServiceStatus.OPEN)
    if state_code == "IN":
        query = query.where(Service.government_level == GovernmentLevel.CENTRAL)
    elif state_code is not None:
        normalized = state_code.upper()
        if normalized not in SUPPORTED_STATE_CODES:
            raise ValueError(f"Unsupported state code: {state_code}")
        query = query.where(
            (Service.government_level == GovernmentLevel.CENTRAL)
            | ((Service.government_level == GovernmentLevel.STATE) & (Service.jurisdiction_code == normalized))
        )
    return list(db.scalars(query.order_by(Service.government_level, Service.name)).all())


def get_service(db: Session, service_id: str) -> Service:
    service = db.scalar(
        select(Service)
        .where(Service.id == service_id)
        .options(
            selectinload(Service.fields),
            selectinload(Service.document_requirements),
        )
    )
    if service is None:
        raise ServiceNotFoundError
    return service
