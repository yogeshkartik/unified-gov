import re
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.digilocker import document_provider
from app.integrations.digilocker.mock import ProviderDocumentNotFoundError
from app.integrations.digilocker.provider import DocumentProvider, ProviderConsent, ProviderDocument
from app.models.application import ApplicationDocument
from app.models.profile import Document, DocumentSource
from app.services import application_engine


def get_documents(user_id: str, provider: DocumentProvider = document_provider) -> list[ProviderDocument]:
    return provider.get_documents(user_id)


def get_document(document_id: str, provider: DocumentProvider = document_provider) -> ProviderDocument:
    return provider.get_document(document_id)


def request_consent(
    user_id: str, document_ids: list[str], provider: DocumentProvider = document_provider
) -> ProviderConsent:
    return provider.request_consent(user_id, document_ids)


def select_application_documents(
    db: Session,
    application_id: str,
    provider_document_ids: list[str],
    provider: DocumentProvider = document_provider,
) -> list[Document]:
    application = application_engine.get_application(db, application_id)
    application_engine.ensure_editable(application)
    provider.request_consent(application.user_id, provider_document_ids)

    selected_documents: list[Document] = []
    selected_document_ids = {item.document_id for item in application.documents}
    for provider_document_id in provider_document_ids:
        provider_document = provider.get_document(provider_document_id)
        storage_key = f"mock-digilocker/{provider_document.id}"
        document = db.scalar(
            select(Document).where(
                Document.user_id == application.user_id,
                Document.source == DocumentSource.DIGILOCKER,
                Document.storage_key == storage_key,
            )
        )
        slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", provider_document.name.lower()).strip("-")
        filename = f"{slug}-demo.pdf"

        if document is None:
            document = Document(
                user_id=application.user_id,
                name=provider_document.name,
                display_name=provider_document.name,
                document_type=provider_document.document_type,
                source=DocumentSource.DIGILOCKER,
                storage_key=storage_key,
                stored_filename="demo-government-document.pdf",
                original_filename=filename,
                mime_type="application/pdf",
                is_imported=False,
            )
            db.add(document)
            db.flush()
        if document.id not in selected_document_ids:
            db.add(ApplicationDocument(application_id=application.id, document_id=document.id))
            selected_document_ids.add(document.id)
        selected_documents.append(document)
    db.commit()
    return selected_documents


__all__ = ["ProviderDocumentNotFoundError"]
