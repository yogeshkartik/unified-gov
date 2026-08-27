from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.integrations.payment.provider import PaymentProvider, PaymentResult


class MockPaymentProvider(PaymentProvider):
    """In-memory payment simulator; it never contacts a payment processor."""

    def __init__(self, force_failure: bool = False) -> None:
        self.force_failure = force_failure
        self._statuses: dict[str, str] = {}

    def create_payment(
        self, application_snapshot: dict[str, Any], amount: float, currency: str
    ) -> PaymentResult:
        transaction_id = f"DEMO-TXN-{uuid4().hex[:10].upper()}"
        status = "FAILED" if self.force_failure else "SUCCESS"
        self._statuses[transaction_id] = status
        return PaymentResult(transaction_id=transaction_id, status=status)

    def get_payment_status(self, transaction_id: str) -> str:
        return self._statuses.get(transaction_id, "NOT_FOUND")
