from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from sqlalchemy.orm import Session

from app.models.profile import AddressType, EducationLevel
from app.models.service import GovernmentLevel, Service
from app.services.profile_service import get_profile
from app.services.service_catalog import SUPPORTED_STATE_CODES, list_services


STATE_CODES = {
    "BIHAR": "BR", "KARNATAKA": "KA", "MAHARASHTRA": "MH", "TAMIL NADU": "TN",
    "UTTAR PRADESH": "UP", "WEST BENGAL": "WB",
}

# Curated service keys share a compact, data-driven relevance configuration.
RULES = {
    "JEE_MAIN": {"base": 20, "education": {EducationLevel.TENTH, EducationLevel.TWELFTH, EducationLevel.DIPLOMA}, "education_score": 55, "age": (15, 25), "age_score": 8},
    "NATIONAL_ENTRANCE_EXAMS": {"base": 20, "education": {EducationLevel.TENTH, EducationLevel.TWELFTH, EducationLevel.DIPLOMA}, "education_score": 55, "age": (15, 25), "age_score": 8},
    "NATIONAL_SCHOLARSHIP": {"base": 22, "education": set(EducationLevel), "education_score": 42},
    "UPSC_CSE": {"base": 18, "education": {EducationLevel.GRADUATION, EducationLevel.POSTGRADUATION}, "education_score": 55, "age": (20, 35), "age_score": 8},
    "VOTER_ID": {"base": 18, "age": (18, 120), "age_score": 30},
    "E_SHRAM": {"base": 18, "employment": {"EMPLOYED", "SELF_EMPLOYED"}, "employment_score": 30},
    "PM_KISAN": {"base": 12, "occupation": {"FARMER", "AGRICULTURE"}, "occupation_score": 35},
    "PAN_CARD": {"base": 26},
    "PASSPORT": {"base": 24},
    "AYUSHMAN_BHARAT": {"base": 20},
    "PMAY": {"base": 18},
    "STATE_MERIT_SCHOLARSHIP": {"base": 16, "education": set(EducationLevel), "education_score": 40, "state_score": 20},
    "STATE_RECRUITMENT_EXAM": {"base": 16, "education": {EducationLevel.GRADUATION, EducationLevel.POSTGRADUATION}, "education_score": 35, "state_score": 20},
    "DRIVING_LICENCE": {"base": 16, "age": (18, 120), "age_score": 20, "state_score": 20},
    "INCOME_CERTIFICATE": {"base": 12, "state_score": 20},
    "CASTE_CERTIFICATE": {"base": 12, "state_score": 20},
    "DOMICILE_CERTIFICATE": {"base": 12, "state_score": 20},
}


@dataclass(frozen=True)
class RecommendedService:
    service: Service
    score: int
    reasons: list[str]


def permanent_state_code(profile: object) -> str | None:
    addresses = getattr(profile, "addresses", [])
    state = next((address.state for address in addresses if address.type == AddressType.PERMANENT), None)
    normalized = state.strip().upper() if state else ""
    code = normalized if normalized in SUPPORTED_STATE_CODES else STATE_CODES.get(normalized)
    return code if code in SUPPORTED_STATE_CODES else None


def recommend_services(db: Session, limit: int = 6) -> list[RecommendedService]:
    profile = get_profile(db)
    permanent_state = permanent_state_code(profile)
    education_levels = {record.level for record in profile.user.education_records}
    age = _age(profile.date_of_birth)
    employment = (profile.employment_status or "").upper()
    occupation = (profile.occupation or "").upper()
    candidates: list[RecommendedService] = []

    for service in list_services(db):
        if service.government_level == GovernmentLevel.STATE and service.jurisdiction_code != permanent_state:
            continue
        rule = RULES.get(service.service_key or "", {"base": 10})
        score = int(rule.get("base", 10))
        reasons: list[str] = ["GENERAL_RELEVANCE"]
        if service.government_level == GovernmentLevel.STATE and permanent_state:
            score += int(rule.get("state_score", 12))
            reasons.append("PERMANENT_STATE_MATCH")
        if education_levels & rule.get("education", set()):
            score += int(rule.get("education_score", 0))
            reasons.append("EDUCATION_STAGE_MATCH")
        age_range = rule.get("age")
        if age_range and age is not None and age_range[0] <= age <= age_range[1]:
            score += int(rule.get("age_score", 0))
            reasons.append("AGE_RELEVANCE")
        if employment in rule.get("employment", set()):
            score += int(rule.get("employment_score", 0))
            reasons.append("EMPLOYMENT_STATUS_MATCH")
        if occupation in rule.get("occupation", set()):
            score += int(rule.get("occupation_score", 0))
            reasons.append("OCCUPATION_MATCH")
        candidates.append(RecommendedService(service=service, score=score, reasons=reasons))

    return sorted(candidates, key=lambda item: (-item.score, item.service.id))[:limit]


def _age(date_of_birth: date) -> int:
    today = date.today()
    return today.year - date_of_birth.year - ((today.month, today.day) < (date_of_birth.month, date_of_birth.day))
