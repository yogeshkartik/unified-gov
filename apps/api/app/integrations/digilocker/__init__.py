from app.integrations.digilocker.mock import MockDigiLockerProvider
from app.integrations.digilocker.provider import DocumentProvider

document_provider: DocumentProvider = MockDigiLockerProvider()

__all__ = ["DocumentProvider", "MockDigiLockerProvider", "document_provider"]
