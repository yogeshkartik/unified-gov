from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.service import Service


class ServiceNotFoundError(Exception):
    pass


def list_services(db: Session) -> list[Service]:
    return list(db.scalars(select(Service).order_by(Service.name)).all())


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
