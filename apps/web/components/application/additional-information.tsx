"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/src/lib/api";
import type { ApplicationEngineResponse, GovernmentServiceDetail } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { applicationFlowSteps, navigateApplicationFlow } from "@/components/application/application-flow-navigation";
import { type DynamicFormValues } from "@/components/application/dynamic-field";
import { DynamicForm } from "@/components/application/dynamic-form";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeService } from "@/src/i18n/service-localization";

function booleanDefault(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "no") return false;
  return undefined;
}

export function AdditionalInformation({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { language, t } = useCitizenPreferences();
  const [data, setData] = useState<{
    application: ApplicationEngineResponse;
    service: GovernmentServiceDetail;
  }>();
  const [error, setError] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .getApplication(applicationId)
      .then(async (application) => {
        setData({ application, service: await api.getService(application.service_id) });
      })
      .catch(() => setError(true));
  }, [applicationId]);

  async function save(values: DynamicFormValues) {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const application = await api.saveAdditionalData(applicationId, values);
      if (application.missing_fields.length === 0) navigateApplicationFlow(router, applicationId, "consent", "forward");
      else setData((current) => current ? { ...current, application } : current);
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : t("completeMissing")
      );
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <ErrorState>
        {t("applicationNotLoaded")}
      </ErrorState>
    );
  }

  if (!data) return <LoadingState label={t("loadingApplicationDetails")} />;

  const localizedService = localizeService(data.service, language);

  const defaultValues = data.service.fields.reduce<DynamicFormValues>(
    (values, field) => ({
      ...values,
      [field.key]:
        field.field_type === "checkbox"
          ? booleanDefault(data.application.answers[field.key])
          : (field.field_type === "number" && data.application.answers[field.key] != null
          ? String(data.application.answers[field.key])
          : (data.application.answers[field.key] as DynamicFormValues[string])) ?? "",
    }),
    {}
  );

  return (
    <ApplicationFlowShell
      serviceName={localizedService.name}
      applicationId={applicationId}
      step={applicationFlowSteps.additional.index}
      stepName={t("additionalStep")}
      onClose={() => router.push("/applications")}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("additionalInformation")}
        </h1>

        <DynamicForm
          fields={localizedService.fields}
          defaultValues={defaultValues}
          onSubmit={save}
          isSubmitting={submitting}
          submitLabel={t("continue")}
          onBack={() => router.push("/services")}
        />

        {submitError ? (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </div>
    </ApplicationFlowShell>
  );
}
