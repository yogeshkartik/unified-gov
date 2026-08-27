from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.profile import EducationCreate, EducationResponse, ProfileResponse, ProfileUpdate
from app.services import profile_service

router = APIRouter(tags=["profile"])


def profile_response(profile: object) -> ProfileResponse:
    return ProfileResponse.model_validate(profile)


@router.get("/profile", response_model=ProfileResponse)
def read_profile(db: Session = Depends(get_db)) -> ProfileResponse:
    try:
        return profile_response(profile_service.get_profile(db))
    except profile_service.ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error


@router.put("/profile", response_model=ProfileResponse)
def replace_profile(payload: ProfileUpdate, db: Session = Depends(get_db)) -> ProfileResponse:
    try:
        return profile_response(profile_service.update_profile(db, payload))
    except profile_service.ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error


@router.get("/profile/education", response_model=list[EducationResponse])
def read_education(db: Session = Depends(get_db)) -> list[EducationResponse]:
    try:
        return profile_service.list_education(db)
    except profile_service.ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error


@router.post("/profile/education", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def add_education(payload: EducationCreate, db: Session = Depends(get_db)) -> EducationResponse:
    try:
        return profile_service.create_education(db, payload)
    except profile_service.ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error
