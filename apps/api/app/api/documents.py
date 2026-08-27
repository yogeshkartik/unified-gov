from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.profile import DocumentResponse
from app.services import profile_service

router = APIRouter(tags=["documents"])


@router.get("/documents", response_model=list[DocumentResponse])
def read_documents(db: Session = Depends(get_db)) -> list[DocumentResponse]:
    try:
        return profile_service.list_documents(db)
    except profile_service.ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error
