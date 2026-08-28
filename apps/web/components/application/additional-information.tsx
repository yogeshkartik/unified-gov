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

export function AdditionalInformation({ applicationId }: { applicationId: string }) {
  const router = useRouter();
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
          : "We could not save your information. Check your entries and try again."
      );
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <ErrorState>
        This application could not be loaded. Return to services and create a new draft.
      </ErrorState>
    );
  }

  if (!data) return <LoadingState label="Loading application fields…" />;

  const defaultValues = data.service.fields.reduce<DynamicFormValues>(
    (values, field) => ({
      ...values,
      [field.key]:
        (field.field_type === "NUMBER" && data.application.answers[field.key] != null
          ? String(data.application.answers[field.key])
          : (data.application.answers[field.key] as DynamicFormValues[string])) ??
        (field.field_type === "CHECKBOX" ? false : ""),
    }),
    {}
  );

  return (
    <ApplicationFlowShell
      serviceName={data.service.name}
      applicationId={applicationId}
      step={applicationFlowSteps.additional.index}
      stepName={applicationFlowSteps.additional.label}
      onClose={() => router.push("/applications")}
    >
      <div className="space-y-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Additional information
        </h1>

        <DynamicForm
          fields={data.service.fields}
          defaultValues={defaultValues}
          onSubmit={save}
          isSubmitting={submitting}
          submitLabel="Continue"
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
