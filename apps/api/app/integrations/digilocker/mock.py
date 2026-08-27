from app.integrations.digilocker.provider import DocumentProvider, ProviderConsent, ProviderDocument


class ProviderDocumentNotFoundError(Exception):
    pass


class MockDigiLockerProvider(DocumentProvider):
    """Local-only synthetic credential provider for the hackathon prototype."""

    _documents = (
        ProviderDocument("mock-class-10", "Class 10 Marksheet", "10TH_MARKSHEET", "Education Board"),
        ProviderDocument("mock-class-12", "Class 12 Marksheet", "12TH_MARKSHEET", "Education Board"),
        ProviderDocument("mock-income", "Income Certificate", "INCOME_CERTIFICATE", "Revenue Department"),
        ProviderDocument("mock-caste", "Caste Certificate", "CASTE_CERTIFICATE", "Social Welfare Department"),
        ProviderDocument("mock-driving-licence", "Driving Licence", "DRIVING_LICENCE", "Transport Department"),
        ProviderDocument("mock-degree", "Degree Certificate", "DEGREE_CERTIFICATE", "University"),
    )

    def get_documents(self, user_id: str) -> list[ProviderDocument]:
        return list(self._documents)

    def get_document(self, document_id: str) -> ProviderDocument:
        for document in self._documents:
            if document.id == document_id:
                return document
        raise ProviderDocumentNotFoundError(document_id)

    def request_consent(self, user_id: str, document_ids: list[str]) -> ProviderConsent:
        for document_id in document_ids:
            self.get_document(document_id)
        return ProviderConsent(user_id=user_id, document_ids=document_ids, status="GRANTED")
