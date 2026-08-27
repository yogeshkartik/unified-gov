from app.integrations.payment.mock import MockPaymentProvider
from app.integrations.payment.provider import PaymentProvider

payment_provider: PaymentProvider = MockPaymentProvider()

__all__ = ["MockPaymentProvider", "PaymentProvider", "payment_provider"]
