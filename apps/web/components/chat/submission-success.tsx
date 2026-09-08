"use client";

import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";
import type { SubmissionSuccess as SubmissionSuccessData } from "@/src/types";
import { Button, LinkButton } from "@/components/ui/button";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localeFor } from "@/src/i18n/locale-format";

export function SubmissionSuccess({ success }: { success: SubmissionSuccessData }) {
  const { language, t } = useCitizenPreferences();
  const [copied, setCopied] = useState(false);
  async function copyReference() {
    try { await navigator.clipboard.writeText(success.reference_number); setCopied(true); }
    catch { setCopied(false); }
  }
  return <section className="mt-2 min-w-0 rounded-lg border border-emerald-200 bg-card p-3 text-foreground" aria-labelledby={`success-${success.application_id}`}>
    <div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" /><div className="min-w-0"><h3 id={`success-${success.application_id}`} className="font-semibold">{t("applicationSubmittedSuccessfully")}</h3><p className="break-words text-sm text-muted-foreground">{success.service_name}</p></div></div>
    <dl className="mt-3 space-y-2 border-t pt-3"><div><dt className="text-xs text-muted-foreground">{t("referenceNumber")}</dt><dd className="select-all break-all font-mono text-sm font-semibold">{success.reference_number}</dd></div><div><dt className="text-xs text-muted-foreground">{t("submittedOn")}</dt><dd className="text-sm">{new Intl.DateTimeFormat(localeFor(language), { dateStyle: "medium", timeStyle: "short" }).format(new Date(success.submitted_at))}</dd></div><div><dt className="text-xs text-muted-foreground">{t("status")}</dt><dd className="text-sm font-medium">{t("submitted")}</dd></div></dl>
    <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onPress={copyReference}><Copy aria-hidden="true" />{copied ? t("referenceCopied") : t("copyReference")}</Button><LinkButton size="sm" href={`/applications/${success.application_id}`}>{t("viewApplication")}</LinkButton></div>
    <p className="sr-only" aria-live="polite">{copied ? t("referenceCopied") : ""}</p>
  </section>;
}
