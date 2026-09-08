from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.service import GovernmentLevel, Service, ServiceStatus

SUPPORTED_STATE_CODES = frozenset({"BR", "KA", "MH", "TN", "UP", "WB"})


class ServiceNotFoundError(Exception):
    pass


def list_services(
    db: Session,
    state_code: str | None = None,
    *,
    include_all_supported_states: bool = False,
) -> list[Service]:
    query = select(Service).where(Service.status == ServiceStatus.OPEN)
    if state_code == "IN":
        if not include_all_supported_states:
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


def search_services(db: Session, query: str, state_code: str | None = None, category: str | None = None) -> list[Service]:
    """Search the public, active catalog only; chat never owns service records."""
    normalized = " ".join(query.lower().split())
    terms = [term for term in normalized.replace("-", " ").split() if len(term) > 2]
    statement = select(Service).where(Service.status == ServiceStatus.OPEN)
    if state_code:
        state = state_code.upper()
        if state in SUPPORTED_STATE_CODES:
            statement = statement.where(or_(Service.government_level == GovernmentLevel.CENTRAL, Service.jurisdiction_code == state))
    if category:
        statement = statement.where(Service.category.ilike(f"%{category}%"))
    candidates = list(db.scalars(statement).all())
    aliases = {
        "income": ("income certificate",), "proof": ("income certificate",), "engineering": ("jee main",),
        "farmer": ("pm kisan",), "job": ("recruitment", "examination"), "exam": ("examination",),
        "passport": ("passport",), "scholarship": ("scholarship",), "caste": ("caste certificate",),
    }
    def score(service: Service) -> int:
        haystack = " ".join((service.name, service.description, service.department, service.category, service.service_key or "")).lower()
        value = sum(4 for term in terms if term in haystack)
        for term in terms:
            value += sum(3 for alias in aliases.get(term, ()) if alias in haystack)
        return value
    return sorted((service for service in candidates if score(service) > 0), key=lambda item: (-score(item), item.name))[:6]
