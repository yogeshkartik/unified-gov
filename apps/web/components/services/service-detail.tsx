"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Landmark, LoaderCircle } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationDetail, ApplicationSummary, GovernmentServiceDetail } from "@/src/types";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCitizenAuth } from "@/components/providers/citizen-auth";
import { applicationFlowPath } from "@/components/application/application-flow-navigation";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeProfileField, localizeService } from "@/src/i18n/service-localization";
import { localeFor } from "@/src/i18n/locale-format";
import { jurisdictionName } from "@/src/i18n/jurisdictions";
import { displayDeadline } from "@/src/lib/service-deadline";

function formatFieldName(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function draftStep(application: ApplicationDetail) {
  if (application.status === "ADDITIONAL_INFO_REQUIRED") return "additional" as const;
  if (application.status === "DRAFT" || application.status === "CONSENT_REQUIRED") return "consent" as const;
  if (application.status === "PAYMENT_REQUIRED") return "payment" as const;
  return "preview" as const;
}

function isDraft(application: ApplicationSummary) {
  return ["DRAFT", "ADDITIONAL_INFO_REQUIRED", "CONSENT_REQUIRED", "READY_FOR_REVIEW", "PAYMENT_REQUIRED"].includes(application.status);
}

export function ServiceDetail({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [service, setService] = useState<GovernmentServiceDetail>();
  const [error, setError] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string>();
  const [draftApplication, setDraftApplication] = useState<ApplicationSummary>();
  const [continuingDraft, setContinuingDraft] = useState(false);
  const { session } = useCitizenAuth();
  const { language, t } = useCitizenPreferences();

  useEffect(() => {
    api.getService(serviceId).then(setService).catch(() => setError(true));
  }, [serviceId]);

  useEffect(() => {
    if (!session) {
      return;
    }
    api.getApplications()
      .then((applications) => setDraftApplication(applications.find((application) => application.service_id === serviceId && isDraft(application))))
      .catch(() => setDraftApplication(undefined));
  }, [serviceId, session]);

  async function apply() {
    setApplying(true);
    setApplyError(undefined);
    try {
      const application = await api.createApplication(serviceId);
      router.push(applicationFlowPath(application.id, application.missing_fields.length === 0 ? "consent" : "additional"));
    } catch {
      setApplyError(t("createApplicationError"));
      setApplying(false);
    }
  }

  async function continueDraft() {
    if (!draftApplication) return;
    setContinuingDraft(true);
    setApplyError(undefined);
    try {
      const application = await api.getApplication(draftApplication.id);
      router.push(applicationFlowPath(application.id, draftStep(application)));
    } catch {
      setApplyError(t("applicationLoadError"));
      setContinuingDraft(false);
    }
  }

  if (error) return <ErrorState>{t("serviceLoadError")}</ErrorState>;
  if (!service) return <LoadingState label={t("loadingServiceDetails")} />;

  const localizedService = localizeService(service, language);
  const locale = localeFor(language);
  const deadline = displayDeadline(service);
  const fee = service.fee > 0 ? t("fee", { amount: new Intl.NumberFormat(locale, { style: "currency", currency: service.currency, maximumFractionDigits: 0 }).format(service.fee) }) : t("noApplicationFee");
  const requiredDocuments = [...localizedService.document_requirements]
    .filter((document) => document.required)
    .sort((a, b) => a.position - b.position);
  const additionalFields = [...localizedService.fields].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-blue-50/70 to-card p-5 shadow-sm sm:p-7">
        <p className="text-sm font-medium text-primary">{localizedService.category}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{localizedService.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Landmark className="size-4" aria-hidden="true" />{localizedService.department}</p>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground"><div className="flex gap-1"><dt>{t("governmentLevel")}:</dt><dd>{service.government_level === "CENTRAL" ? t("centralGovernment") : t("stateGovernment")}</dd></div><div className="flex gap-1"><dt>{t("jurisdiction")}:</dt><dd>{jurisdictionName(service.jurisdiction_code, language)}</dd></div></dl>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{localizedService.description}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-medium text-muted-foreground"><span>{fee}</span>{deadline ? <Badge variant="secondary">{t("applicationDeadline")}: {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(deadline))}</Badge> : null}</div>
        <div className="mt-6 flex flex-wrap gap-3">
          {session ? <>{draftApplication ? <Button size="lg" variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" onPress={continueDraft} isDisabled={continuingDraft}>{continuingDraft ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("loading")}</> : "Continue with draft application"}</Button> : null}<Button size="lg" onPress={apply} isDisabled={applying}>{applying ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("creatingApplication")}</> : draftApplication ? "Apply new" : t("applyNow")}</Button></> : <LinkButton href={`/login?returnTo=${encodeURIComponent(`/services/${serviceId}`)}`} size="lg">{t("signInToApply")}</LinkButton>}
        </div>
        {applyError ? <p role="alert" className="mt-3 text-sm text-destructive">{applyError}</p> : null}
      </section>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">{t("whatYouNeed")}</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <section aria-labelledby="profile-requirements-heading">
            <h2 id="profile-requirements-heading" className="text-sm font-medium">{t("fromProfile")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{localizedService.required_profile_fields.map((field) => <li key={field} className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />{language === "en" ? formatFieldName(field) : localizeProfileField(field, language)}</li>)}</ul>
          </section>
          <section aria-labelledby="document-requirements-heading">
            <h2 id="document-requirements-heading" className="text-sm font-medium">{t("documents")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{requiredDocuments.map((document) => <li key={document.id} className="flex items-center gap-2"><FileText className="size-4 shrink-0" aria-hidden="true" />{document.label}</li>)}</ul>
          </section>
          <section aria-labelledby="additional-requirements-heading">
            <h2 id="additional-requirements-heading" className="text-sm font-medium">{t("additionalInformation")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{additionalFields.map((field) => <li key={field.id} className="flex items-center gap-2"><span className="text-base leading-none" aria-hidden="true">•</span>{field.label}</li>)}</ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
