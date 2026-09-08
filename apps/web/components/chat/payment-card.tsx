"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import type { PayChatApplicationResponse, PaymentCard as PaymentCardData } from "@/src/types";
import { api } from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localeFor } from "@/src/i18n/locale-format";

export function PaymentCard({ card, onPaid, onRejected }: { card: PaymentCardData; onPaid: (result: PayChatApplicationResponse) => void; onRejected: () => void }) {
  const { language, t } = useCitizenPreferences();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(false);
  const amount = new Intl.NumberFormat(localeFor(language), { style: "currency", currency: card.currency }).format(card.amount);
  const successful = card.payment_status === "SUCCESS";
  async function pay() {
    if (processing || successful) return;
    setProcessing(true); setError(false);
    try {
      const result = await api.payChatApplication(card.application_id);
      if (result.payment.status === "SUCCESS") onPaid(result);
      else { setError(true); onRejected(); }
    } catch { setError(true); onRejected(); }
    finally { setProcessing(false); }
  }
  return <section className="mt-2 min-w-0 rounded-lg border bg-card p-3 text-foreground" aria-labelledby={`payment-${card.application_id}`}>
    <h3 id={`payment-${card.application_id}`} className="font-semibold">{t("demoApplicationPayment")}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{t("demoPaymentOnly")}</p>
    <dl className="mt-3 space-y-2 border-t pt-3"><div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{t("applicationFee")}</dt><dd className="font-semibold" aria-label={t("fee", { amount })}>{amount}</dd></div><div className="flex items-center justify-between gap-3"><dt className="text-muted-foreground">{t("status")}</dt><dd className="flex items-center gap-1 font-medium">{successful ? <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" /> : null}{successful ? t("paymentSuccess") : t("paymentPending")}</dd></div>{card.transaction_reference ? <div className="min-w-0"><dt className="text-xs text-muted-foreground">{t("transactionReference")}</dt><dd className="break-all font-mono text-xs">{card.transaction_reference}</dd></div> : null}</dl>
    {!successful ? <Button className="mt-3" size="sm" onPress={pay} isDisabled={processing}>{processing ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("processingPayment")}</> : t("completeDemoPayment", { amount })}</Button> : null}
    {processing ? <p className="sr-only" aria-live="polite">{t("processingPayment")}</p> : null}
    {error ? <p role="alert" className="mt-2 text-sm text-destructive">{t("demoPaymentFailed")}</p> : null}
  </section>;
}
