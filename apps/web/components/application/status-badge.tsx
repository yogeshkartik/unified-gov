"use client";

import { Badge } from "@/components/ui/badge";
import { useCitizenPreferences, type TranslationKey } from "@/components/providers/citizen-preferences";
import type { ApplicationStatus } from "@/src/types";

export function statusTranslationKey(status: ApplicationStatus): TranslationKey { return `status${status}` as TranslationKey; }

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useCitizenPreferences();
  const className = {
    DRAFT: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    ADDITIONAL_INFO_REQUIRED: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    CONSENT_REQUIRED: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    READY_FOR_REVIEW: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    PAYMENT_REQUIRED: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    SUBMITTED: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    PROCESSING: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    REJECTED: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
    CANCELLED: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  } satisfies Record<ApplicationStatus, string>;
  return <Badge variant="outline" className={className[status]}>{t(statusTranslationKey(status))}</Badge>;
}
