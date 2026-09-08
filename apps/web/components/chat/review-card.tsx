"use client";

import type { ReactNode } from "react";
import type { ApplicationReview, ReviewValue } from "@/src/types";
import { Button, LinkButton } from "@/components/ui/button";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localeFor } from "@/src/i18n/locale-format";
import {
  localizeDepartment,
  localizeDocumentType,
  localizeProfileField,
  localizeServiceFieldLabel,
  localizeServiceFieldOption,
  localizeServiceName,
} from "@/src/i18n/service-localization";

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="border-t pt-3"><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>{children}</section>;
}

function valueText(item: ReviewValue, language: Parameters<typeof localeFor>[0], yes: string, no: string) {
  if (item.field_type === "checkbox" && typeof item.value === "boolean") return item.value ? yes : no;
  if (item.field_type === "date" && typeof item.value === "string") {
    const date = new Date(item.value);
    if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat(localeFor(language), { dateStyle: "medium" }).format(date);
  }
  if ((item.field_type === "select" || item.field_type === "radio") && typeof item.value === "string") return localizeServiceFieldOption(item.value, language);
  return String(item.value ?? "—");
}

export function ReviewCard({ review, onContinue }: { review: ApplicationReview; onContinue: () => void }) {
  const { language, t } = useCitizenPreferences();
  const fee = review.payment.required
    ? new Intl.NumberFormat(localeFor(language), { style: "currency", currency: review.payment.currency }).format(review.payment.amount)
    : t("free");
  const paymentStatus = !review.payment.required ? t("paymentNotRequired") : review.payment.status === "COMPLETED" ? t("completeStatus") : t("paymentPending");
  return <article className="mt-2 min-w-0 space-y-3 rounded-lg border bg-card p-3 text-foreground" aria-labelledby={`review-${review.application_id}`}>
    <header><h3 id={`review-${review.application_id}`} className="font-semibold">{t("chatApplicationReview")}</h3><p className="mt-1 break-words text-sm">{localizeServiceName(review.service.id, review.service.name, language)}</p><p className="text-xs text-muted-foreground">{localizeDepartment(review.service.id, review.service.department, language)}</p></header>
    <ReviewSection title={t("applicantInformation")}><dl className="mt-2 space-y-2">{review.applicant_information.map((item) => <div key={item.key} className="min-w-0"><dt className="text-xs text-muted-foreground">{localizeProfileField(item.key, language)}</dt><dd className="break-words text-sm font-medium">{valueText(item, language, t("yes"), t("no"))}</dd></div>)}</dl></ReviewSection>
    {review.application_details.length > 0 ? <ReviewSection title={t("applicationDetails")}><dl className="mt-2 space-y-2">{review.application_details.map((item) => <div key={item.key} className="min-w-0"><dt className="text-xs text-muted-foreground">{localizeServiceFieldLabel(item.key, item.label, language)}</dt><dd className="break-words text-sm font-medium">{valueText(item, language, t("yes"), t("no"))}</dd></div>)}</dl></ReviewSection> : null}
    {review.documents.length > 0 ? <ReviewSection title={t("documents")}><ul className="mt-2 space-y-2">{review.documents.map((document) => <li key={document.requirement_id} className="min-w-0"><p className="text-xs text-muted-foreground">{localizeDocumentType(document.document_type, document.label, language)}</p><p className="break-words text-sm font-medium">{document.name}</p></li>)}</ul></ReviewSection> : null}
    <ReviewSection title={t("applicationFee")}><div className="mt-2 flex items-start justify-between gap-3"><span className="font-medium">{fee}</span><span className="text-xs text-muted-foreground">{paymentStatus}</span></div></ReviewSection>
    <ReviewSection title={t("consent")}><p className="mt-2 text-sm font-medium">{review.consent.granted ? t("consentRecorded") : t("consentPending")}</p></ReviewSection>
    {!review.consent.granted ? <div className="flex flex-wrap gap-2 pt-1"><Button size="sm" onPress={onContinue}>{t("reviewAndContinue")}</Button><LinkButton size="sm" variant="outline" href={`/applications/${review.application_id}/apply?step=additional`}>{t("changeDetails")}</LinkButton><LinkButton size="sm" variant="outline" href={`/applications/${review.application_id}/apply?step=consent`}>{t("changeDocuments")}</LinkButton></div> : null}
  </article>;
}
