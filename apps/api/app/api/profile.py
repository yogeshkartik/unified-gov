from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.profile import DocumentType
from app.schemas.profile import DocumentResponse, EducationCreate, EducationResponse, ProfileResponse, ProfileUpdate
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


@router.put("/profile/photo", response_model=DocumentResponse)
async def replace_profile_photo(file: UploadFile = File(...), db: Session = Depends(get_db)) -> DocumentResponse:
    try:
        return await profile_service.save_upload(db, file, DocumentType.PHOTOGRAPH)
    except (profile_service.ProfileNotFoundError, profile_service.InvalidDocumentError) as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={"code": getattr(error, "code", "PROFILE_NOT_FOUND"), "message": str(error)},
        ) from error


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
