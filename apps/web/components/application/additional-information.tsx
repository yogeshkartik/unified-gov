"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { api, ApiError } from "@/src/lib/api";
import type { ApplicationEngineResponse, GovernmentServiceDetail } from "@/src/types";
import { ApplicationProgress } from "@/components/application/application-progress";
import { type DynamicFormValues } from "@/components/application/dynamic-field";
import { DynamicForm } from "@/components/application/dynamic-form";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdditionalInformation({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{ application: ApplicationEngineResponse; service: GovernmentServiceDetail }>();
  const [error, setError] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { api.getApplication(applicationId).then(async (application) => setData({ application, service: await api.getService(application.service_id) })).catch(() => setError(true)); }, [applicationId]);
  useEffect(() => { if (data && data.application.missing_fields.length === 0) router.replace(`/applications/${applicationId}/consent`); }, [applicationId, data, router]);
  async function save(values: DynamicFormValues) {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const application = await api.saveAdditionalData(applicationId, values);
      router.push(application.missing_fields.length === 0 ? `/applications/${applicationId}/consent` : `/applications/${applicationId}/additional`);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "We could not save your information. Check your entries and try again.");
      setSubmitting(false);
    }
  }
  if (error) return <ErrorState>This application could not be loaded. Return to services and create a new draft.</ErrorState>;
  if (!data) return <LoadingState label="Loading application fields…" />;
  const defaultValues = data.service.fields.reduce<DynamicFormValues>((values, field) => ({ ...values, [field.key]: data.application.answers[field.key] as DynamicFormValues[string] ?? (field.field_type === "CHECKBOX" ? false : "") }), {});
  return <div className="mx-auto max-w-2xl space-y-6"><ApplicationProgress currentStep={1} /><div><p className="text-sm font-medium text-primary">{data.service.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Additional information</h1><p className="mt-2 leading-6 text-muted-foreground">Only service-specific information is requested here. Your reusable profile is not shown as a form.</p></div>{data.application.missing_profile_fields.length > 0 || data.application.missing_documents.length > 0 ? <aside className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div><p className="font-medium">Some reusable information may still be unavailable</p>{data.application.missing_profile_fields.length > 0 ? <p>Profile: {data.application.missing_profile_fields.join(", ")}</p> : null}{data.application.missing_documents.length > 0 ? <><p>Documents: {data.application.missing_documents.map(displayDocumentType).join(", ")}</p><p className="mt-1">After saving this form, select the missing document from DigiLocker on the Consent step.</p></> : null}</div></aside> : null}<Card className="border-t-4 border-t-primary"><CardHeader><CardTitle>Service-specific details</CardTitle><p className="text-sm text-muted-foreground">Fields are defined by the selected service, not hard-coded for a service type.</p></CardHeader><CardContent><DynamicForm fields={data.service.fields} defaultValues={defaultValues} onSubmit={save} isSubmitting={submitting} submitLabel="Save & continue to document selection" />{submitError ? <p role="alert" className="mt-4 text-sm text-destructive">{submitError}</p> : null}</CardContent></Card></div>;
}

function displayDocumentType(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
