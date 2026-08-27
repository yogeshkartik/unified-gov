from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class PaymentResult:
    transaction_id: str
    status: str


class PaymentProvider(Protocol):
    def create_payment(
        self, application_snapshot: dict[str, Any], amount: float, currency: str
    ) -> PaymentResult: ...

    def get_payment_status(self, transaction_id: str) -> str: ...
