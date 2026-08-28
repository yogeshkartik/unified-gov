from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.profile import DocumentType
from app.schemas.profile import DocumentResponse
from app.services import profile_service

router = APIRouter(tags=["documents"])


def error(exc: Exception) -> HTTPException:
    if isinstance(exc, profile_service.DocumentNotFoundError): return HTTPException(404, detail={"code": "DOCUMENT_NOT_FOUND", "message": "Document was not found."})
    if isinstance(exc, profile_service.InvalidDocumentError): return HTTPException(422, detail={"code": exc.code, "message": exc.message})
    return HTTPException(404, detail={"code": "PROFILE_NOT_FOUND"})


@router.get("/documents", response_model=list[DocumentResponse])
@router.get("/profile/documents", response_model=list[DocumentResponse])
def read_documents(db: Session = Depends(get_db)) -> list[DocumentResponse]:
    try:
        return profile_service.list_documents(db)
    except profile_service.ProfileNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "PROFILE_NOT_FOUND"}) from error


@router.post("/profile/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(document_type: DocumentType = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)) -> DocumentResponse:
    try: return await profile_service.save_upload(db, file, document_type)
    except (profile_service.ProfileNotFoundError, profile_service.InvalidDocumentError) as exc: raise error(exc) from exc


@router.put("/profile/documents/{document_id}/file", response_model=DocumentResponse)
async def replace_document(document_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)) -> DocumentResponse:
    try: return await profile_service.replace_upload(db, document_id, file)
    except (profile_service.DocumentNotFoundError, profile_service.InvalidDocumentError) as exc: raise error(exc) from exc


@router.delete("/profile/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document(document_id: str, db: Session = Depends(get_db)) -> None:
    try: profile_service.delete_document(db, document_id)
    except profile_service.DocumentNotFoundError as exc: raise error(exc) from exc


@router.get("/profile/documents/{document_id}/file")
def get_document_file(document_id: str, db: Session = Depends(get_db)) -> FileResponse:
    try: document = profile_service.document_for_user(db, document_id)
    except profile_service.DocumentNotFoundError as exc: raise error(exc) from exc
    path = Path(settings.upload_dir) / Path(document.stored_filename or "").name
    if not document.stored_filename or not path.is_file(): raise HTTPException(404, detail={"code": "FILE_NOT_AVAILABLE"})
    return FileResponse(path, media_type=document.mime_type, filename=document.original_filename)
