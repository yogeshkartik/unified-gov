"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { ConsentCard as ConsentCardData, GrantChatConsentResponse } from "@/src/types";
import { ApiError, api } from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function ConsentCard({ card, onGranted, onRejected }: { card: ConsentCardData; onGranted: (result: GrantChatConsentResponse) => void; onRejected: () => void }) {
  const { t } = useCitizenPreferences();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const labelId = `consent-label-${card.application_id}`;
  async function submit() {
    if (!confirmed || submitting) return;
    setSubmitting(true); setError(undefined);
    try { onGranted(await api.grantChatApplicationConsent(card.application_id)); }
    catch (caught) {
      setError(caught instanceof ApiError && caught.detail?.code === "APPLICATION_INCOMPLETE" ? t("applicationNotReadyForConsent") : t("unableToRecordConsent"));
      onRejected();
    } finally { setSubmitting(false); }
  }
  return <section className="mt-2 min-w-0 rounded-lg border bg-card p-3 text-foreground" aria-labelledby={`consent-heading-${card.application_id}`}>
    <h3 id={`consent-heading-${card.application_id}`} className="font-semibold">{t("consentDeclaration")}</h3>
    <p className="mt-2 break-words text-sm text-muted-foreground">{t("consentProcessingText", { purpose: card.purpose })}</p>
    <div className="mt-3 flex items-start gap-2"><Checkbox aria-labelledby={labelId} isSelected={confirmed} onChange={setConfirmed} isDisabled={submitting} /><span id={labelId} className="text-sm leading-5">{t("confirmInformationCorrect")}</span></div>
    <Button className="mt-3" size="sm" onPress={submit} isDisabled={!confirmed || submitting}>{submitting ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("recordingConsent")}</> : t("giveConsent")}</Button>
    {submitting ? <p className="sr-only" aria-live="polite">{t("recordingConsent")}</p> : null}
    {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
  </section>;
}
