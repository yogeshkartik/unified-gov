"use client";

import { PageHeader } from "@/components/layout/page-header";
import { useCitizenPreferences, type TranslationKey } from "@/components/providers/citizen-preferences";

export function LocalizedPageHeader({ titleKey, descriptionKey }: { titleKey: TranslationKey; descriptionKey: TranslationKey }) {
  const { t } = useCitizenPreferences();
  return <PageHeader title={t(titleKey)} description={t(descriptionKey)} />;
}
