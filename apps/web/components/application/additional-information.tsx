"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { api, ApiError } from "@/src/lib/api";
import type { ApplicationEngineResponse, GovernmentServiceDetail } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
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

  useEffect(() => {
    if (data && data.application.missing_fields.length === 0) {
      router.replace(`/applications/${applicationId}/consent`);
    }
  }, [applicationId, data, router]);

  async function save(values: DynamicFormValues) {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const application = await api.saveAdditionalData(applicationId, values);
      router.push(
        application.missing_fields.length === 0
          ? `/applications/${applicationId}/consent`
          : `/applications/${applicationId}/additional`
      );
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
        (data.application.answers[field.key] as DynamicFormValues[string]) ??
        (field.field_type === "CHECKBOX" ? false : ""),
    }),
    {}
  );

  return (
    <ApplicationFlowShell
      serviceName={data.service.name}
      step={1}
      stepName="Additional information"
      onClose={() => router.push("/applications")}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Additional information
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A few details are needed for this service.
          </p>
        </div>

        {data.application.missing_profile_fields.length > 0 ||
        data.application.missing_documents.length > 0 ? (
          <aside className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div className="space-y-0.5">
              <p className="font-medium">Missing required information</p>
              {data.application.missing_profile_fields.length > 0 ? (
                <p className="text-xs text-amber-800">
                  Profile: {data.application.missing_profile_fields.join(", ")}
                </p>
              ) : null}
              {data.application.missing_documents.length > 0 ? (
                <p className="text-xs text-amber-800">
                  Documents:{" "}
                  {data.application.missing_documents
                    .map((d) => d.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()))
                    .join(", ")}
                </p>
              ) : null}
            </div>
          </aside>
        ) : null}

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
