from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.application import ApplicationDocument
from app.models.profile import Document, DocumentSource
from app.services import application_engine


class ApplicationDocumentNotFoundError(Exception):
    pass


def attach_my_documents(db: Session, application_id: str, document_ids: list[str]) -> list[Document]:
    """Attach existing reusable uploads to an application without copying them."""
    application = application_engine.get_application(db, application_id)
    documents = list(
        db.scalars(
            select(Document).where(
                Document.id.in_(document_ids),
                Document.user_id == application.user_id,
                Document.source == DocumentSource.PROFILE_UPLOAD,
            )
        ).all()
    )
    if len(documents) != len(set(document_ids)):
        raise ApplicationDocumentNotFoundError

    attached_ids = {item.document_id for item in application.documents}
    for document in documents:
        if document.id not in attached_ids:
            db.add(ApplicationDocument(application_id=application.id, document_id=document.id))
    db.commit()
    return documents
