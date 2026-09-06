"use client";

import { Badge } from "@/components/ui/badge";
import { useCitizenPreferences, type TranslationKey } from "@/components/providers/citizen-preferences";
import type { ApplicationStatus } from "@/src/types";

export function statusTranslationKey(status: ApplicationStatus): TranslationKey { return `status${status}` as TranslationKey; }

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useCitizenPreferences();
  const variant = status === "REJECTED" || status === "CANCELLED" ? "destructive" : status === "SUBMITTED" || status === "COMPLETED" ? "default" : "secondary";
  return <Badge variant={variant}>{t(statusTranslationKey(status))}</Badge>;
}
