from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.profile import Document, DocumentSource, DocumentType, Education, Profile, User
from app.schemas.profile import EducationCreate, ProfileUpdate

DEMO_USER_EMAIL = "rahul.demo@example.com"


class ProfileNotFoundError(Exception):
    pass


class DocumentNotFoundError(Exception): pass


class InvalidDocumentError(Exception):
    def __init__(self, code: str, message: str) -> None:
        self.code, self.message = code, message
        super().__init__(message)


ALLOWED_FILES = {".pdf": "application/pdf", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def get_demo_user(db: Session) -> User:
    user = db.scalar(select(User).where(User.email == DEMO_USER_EMAIL))
    if user is None:
        raise ProfileNotFoundError
    return user


def get_profile(db: Session) -> Profile:
    profile = db.scalar(
        select(Profile)
        .join(Profile.user)
        .where(User.email == DEMO_USER_EMAIL)
        .options(selectinload(Profile.user).selectinload(User.addresses))
    )
    if profile is None:
        raise ProfileNotFoundError
    return profile


def update_profile(db: Session, payload: ProfileUpdate) -> Profile:
    profile = get_profile(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    return get_profile(db)


def list_education(db: Session) -> list[Education]:
    user = get_demo_user(db)
    return list(
        db.scalars(select(Education).where(Education.user_id == user.id).order_by(Education.year)).all()
    )


def create_education(db: Session, payload: EducationCreate) -> Education:
    user = get_demo_user(db)
    education = Education(user_id=user.id, **payload.model_dump())
    db.add(education)
    db.commit()
    db.refresh(education)
    return education


def list_documents(db: Session) -> list[Document]:
    user = get_demo_user(db)
    return list(db.scalars(select(Document).where(Document.user_id == user.id).order_by(Document.name)).all())


def document_for_user(db: Session, document_id: str) -> Document:
    user = get_demo_user(db)
    document = db.scalar(select(Document).where(Document.id == document_id, Document.user_id == user.id))
    if document is None: raise DocumentNotFoundError
    return document


async def save_upload(db: Session, upload: UploadFile, document_type: DocumentType) -> Document:
    filename = upload.filename or "upload"; extension = Path(filename).suffix.lower(); expected_mime = ALLOWED_FILES.get(extension)
    if expected_mime is None or upload.content_type != expected_mime:
        raise InvalidDocumentError("UNSUPPORTED_FILE_TYPE", "Only PDF, JPG, JPEG, PNG and WEBP files are supported.")
    category_labels = {item.value: item.value.replace("_", " ").title() for item in DocumentType}
    safe_name = filename if document_type == DocumentType.OTHER else category_labels[document_type.value]
    content = await upload.read()
    if len(content) > MAX_UPLOAD_BYTES: raise InvalidDocumentError("FILE_TOO_LARGE", "Files must be 5 MB or smaller.")
    stored_filename = f"{uuid4()}{extension}"; upload_dir = Path(settings.upload_dir); upload_dir.mkdir(parents=True, exist_ok=True); (upload_dir / stored_filename).write_bytes(content)
    user = get_demo_user(db)
    if document_type == DocumentType.PROFILE_PHOTO:
        old = db.scalar(select(Document).where(Document.user_id == user.id, Document.document_type == DocumentType.PROFILE_PHOTO))
        if old: _delete_file(old.stored_filename); db.delete(old)
    document = Document(user_id=user.id, name=safe_name, display_name=safe_name, document_type=document_type, source=DocumentSource.PROFILE_UPLOAD, storage_key=stored_filename, stored_filename=stored_filename, original_filename=filename, mime_type=upload.content_type, size_bytes=len(content))
    db.add(document); db.commit(); db.refresh(document); return document


async def replace_upload(db: Session, document_id: str, upload: UploadFile) -> Document:
    document = document_for_user(db, document_id); filename = upload.filename or "upload"; extension = Path(filename).suffix.lower(); expected_mime = ALLOWED_FILES.get(extension)
    if expected_mime is None or upload.content_type != expected_mime: raise InvalidDocumentError("UNSUPPORTED_FILE_TYPE", "Only PDF, JPG, JPEG, PNG and WEBP files are supported.")
    content = await upload.read()
    if len(content) > MAX_UPLOAD_BYTES: raise InvalidDocumentError("FILE_TOO_LARGE", "Files must be 5 MB or smaller.")
    stored_filename = f"{uuid4()}{extension}"; upload_dir = Path(settings.upload_dir); upload_dir.mkdir(parents=True, exist_ok=True); (upload_dir / stored_filename).write_bytes(content); _delete_file(document.stored_filename)
    document.storage_key = document.stored_filename = stored_filename; document.original_filename = filename; document.mime_type = upload.content_type; document.size_bytes = len(content); db.commit(); db.refresh(document); return document


def delete_document(db: Session, document_id: str) -> None:
    document = document_for_user(db, document_id); _delete_file(document.stored_filename); db.delete(document); db.commit()


def _delete_file(stored_filename: str | None) -> None:
    if stored_filename:
        path = Path(settings.upload_dir) / Path(stored_filename).name
        if path.exists(): path.unlink()
