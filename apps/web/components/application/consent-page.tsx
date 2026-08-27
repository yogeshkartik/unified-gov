"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationEngineResponse, GovernmentServiceDetail } from "@/src/types";
import { ApplicationProgress } from "@/components/application/application-progress";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

function displayName(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }

export function ConsentPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{ application: ApplicationEngineResponse; service: GovernmentServiceDetail }>();
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  useEffect(() => { api.getApplication(applicationId).then(async (application) => setData({ application, service: await api.getService(application.service_id) })).catch(() => setError(true)); }, [applicationId]);
  async function grantConsent() {
    setSubmitting(true);
    setSubmitError(undefined);
    try { await api.grantConsent(applicationId); router.push(`/applications/${applicationId}/preview`); }
    catch { setSubmitError("We could not record your consent. Complete any required additional information and try again."); setSubmitting(false); }
  }
  if (error) return <ErrorState>This application could not be loaded. Return to the service catalog and try again.</ErrorState>;
  if (!data) return <LoadingState label="Loading consent request…" />;
  return <div className="mx-auto max-w-2xl space-y-6"><ApplicationProgress currentStep={2} /><div><p className="text-sm font-medium text-primary">Consent for {data.service.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Review information sharing</h1><p className="mt-2 leading-6 text-muted-foreground">Only the information listed below will be used for this application.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />Purpose</CardTitle></CardHeader><CardContent><p className="text-sm leading-6">{data.service.name} Application</p><p className="mt-1 text-sm text-muted-foreground">Recipient: {data.service.department}</p></CardContent></Card><Card><CardHeader><CardTitle>Profile information to share</CardTitle></CardHeader><CardContent><ul className="space-y-3">{[...data.service.required_profile_fields, ...data.service.fields.map((field) => field.key)].map((field) => <li key={field} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />{displayName(field)}</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />Documents requested</CardTitle></CardHeader><CardContent><ul className="space-y-3">{data.service.document_requirements.map((document) => <li key={document.id} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />{document.label}{document.required ? <span className="text-xs text-muted-foreground">(required)</span> : null}</li>)}</ul></CardContent></Card><div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center"><LinkButton href={`/applications/${applicationId}/additional`} variant="outline" size="lg">Back</LinkButton><Button size="lg" onPress={grantConsent} isDisabled={submitting}>{submitting ? "Recording consent…" : "Give consent & continue"}</Button></div>{submitError ? <p role="alert" className="text-sm text-destructive">{submitError}</p> : null}</div>;
}
