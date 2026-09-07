"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Landmark } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationDetail, ApplicationEngineResponse, GovernmentServiceDetail } from "@/src/types";
import { ApplicationTimeline } from "@/components/application/application-timeline";
import { ApplicationStatusBadge } from "@/components/application/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localeFor } from "@/src/i18n/locale-format";
import { localizeService } from "@/src/i18n/service-localization";

function nextRoute(application: ApplicationEngineResponse) {
  if (application.missing_fields.length > 0) return "additional";
  if (application.status === "DRAFT" || application.status === "CONSENT_REQUIRED") return "consent";
  if (application.status === "PAYMENT_REQUIRED") return "payment";
  return "preview";
}

function formatAnswer(value: unknown, fieldType: string | undefined, yes: string, no: string) {
  if (fieldType === "checkbox" && typeof value === "boolean") return value ? yes : no;
  return String(value);
}

export function ApplicationDetailPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { language, t } = useCitizenPreferences();
  const [data, setData] = useState<{ application: ApplicationDetail; service: GovernmentServiceDetail }>();
  const [error, setError] = useState(false);
  useEffect(() => { api.getApplication(applicationId).then(async (application) => setData({ application, service: await api.getService(application.service_id) })).catch(() => setError(true)); }, [applicationId]);
  if (error) return <ErrorState>{t("applicationUnavailable")}</ErrorState>;
  if (!data) return <LoadingState label={t("loadingApplicationDetails")} />;
  const isSubmitted = data.application.status === "SUBMITTED";
  const service = localizeService(data.service, language);
  const date = new Intl.DateTimeFormat(localeFor(language), { dateStyle: "medium" }).format(new Date(data.application.created_at));
  const amount = service.fee > 0 ? new Intl.NumberFormat(localeFor(language), { style: "currency", currency: service.currency, maximumFractionDigits: 0 }).format(service.fee) : t("free");
  return <div className="mx-auto max-w-3xl space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-medium text-primary">{t("application")}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{service.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Landmark className="size-4" aria-hidden="true" />{service.department}</p></div><ApplicationStatusBadge status={data.application.status} /></div>{data.application.reference_number ? <Card><CardContent className="pt-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("referenceNumber")}</p><p className="mt-1 font-mono font-semibold">{data.application.reference_number}</p></CardContent></Card> : null}<div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>{t("applicationDetails")}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{t("createdOn", { date })}</p><p className="text-sm text-muted-foreground">{t("feeLabel", { amount })}</p><Button onPress={() => router.push(`/applications/${applicationId}/${isSubmitted ? "preview" : nextRoute(data.application)}`)}>{isSubmitted ? t("viewApplicationPreview") : t("continueApplicationLower")}</Button></CardContent></Card><Card><CardHeader><CardTitle>{t("applicationTimeline")}</CardTitle></CardHeader><CardContent><ApplicationTimeline status={data.application.status} /></CardContent></Card></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />{t("additionalInformation")}</CardTitle></CardHeader><CardContent>{Object.keys(data.application.answers).length === 0 ? <p className="text-sm text-muted-foreground">{t("noAdditionalInformation")}</p> : <dl className="grid gap-4 sm:grid-cols-2">{Object.entries(data.application.answers).map(([key, value]) => { const field = service.fields.find((item) => item.key === key); return <div key={key}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field?.label ?? key.replaceAll("_", " ")}</dt><dd className="mt-1 text-sm">{field?.option_labels?.[String(value)] ?? formatAnswer(value, field?.field_type, t("yes"), t("no"))}</dd></div>; })}</dl>}</CardContent></Card></div>;
}
