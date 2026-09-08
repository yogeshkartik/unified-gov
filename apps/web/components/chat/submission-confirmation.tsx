"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { SubmissionConfirmation as SubmissionConfirmationData, SubmitChatApplicationResponse } from "@/src/types";
import { api } from "@/src/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function SubmissionConfirmation({ card, onSubmitted, onRejected }: { card: SubmissionConfirmationData; onSubmitted: (result: SubmitChatApplicationResponse) => void; onRejected: () => void }) {
  const { t } = useCitizenPreferences();
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const labelId = `submission-label-${card.application_id}`;
  async function submit() {
    if (!confirmed || submitting) return;
    setSubmitting(true); setError(false);
    try { onSubmitted(await api.submitChatApplication(card.application_id)); }
    catch { setError(true); onRejected(); }
    finally { setSubmitting(false); }
  }
  return <section className="mt-2 min-w-0 rounded-lg border bg-card p-3 text-foreground" aria-labelledby={`submission-${card.application_id}`}>
    <h3 id={`submission-${card.application_id}`} className="font-semibold">{t("readyToSubmit")}</h3>
    <p className="mt-1 break-words text-sm text-muted-foreground">{t("confirmSubmissionPrompt", { name: card.service_name })}</p>
    <div className="mt-3 flex items-start gap-2"><Checkbox aria-labelledby={labelId} isSelected={confirmed} onChange={setConfirmed} isDisabled={submitting} /><span id={labelId} className="text-sm leading-5">{t("submissionLockConfirmation")}</span></div>
    <Button className="mt-3" size="sm" onPress={submit} isDisabled={!confirmed || submitting}>{submitting ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("submittingApplication")}</> : t("submitApplication")}</Button>
    {submitting ? <p className="sr-only" aria-live="polite">{t("submittingApplication")}</p> : null}
    {error ? <p role="alert" className="mt-2 text-sm text-destructive">{t("applicationNoLongerReady")}</p> : null}
  </section>;
}
