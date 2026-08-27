"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, ShieldCheck } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationEngineResponse, GovernmentServiceDetail, MockDigiLockerDocument } from "@/src/types";
import { ApplicationProgress } from "@/components/application/application-progress";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Checkbox } from "@/components/ui/checkbox";

function displayName(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()); }

export function ConsentPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{ application: ApplicationEngineResponse; service: GovernmentServiceDetail }>();
  const [documents, setDocuments] = useState<MockDigiLockerDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  useEffect(() => { api.getApplication(applicationId).then(async (application) => { const [service, digilockerDocuments] = await Promise.all([api.getService(application.service_id), api.getDigiLockerDocuments()]); setData({ application, service }); setDocuments(digilockerDocuments); }).catch(() => setError(true)); }, [applicationId]);
  async function grantConsent() {
    setSubmitting(true);
    setSubmitError(undefined);
    try { if (selectedDocumentIds.length > 0) await api.selectApplicationDocuments(applicationId, selectedDocumentIds); await api.grantConsent(applicationId); router.push(`/applications/${applicationId}/preview`); }
    catch { setSubmitError("We could not record your consent. Complete any required additional information and try again."); setSubmitting(false); }
  }
  if (error) return <ErrorState>This application could not be loaded. Return to the service catalog and try again.</ErrorState>;
  if (!data) return <LoadingState label="Loading consent request…" />;
  const matchingDocuments = documents.filter((document) => data.service.document_requirements.some((requirement) => requirement.document_type === document.document_type || (requirement.document_type === "MARKSHEET" && document.document_type.endsWith("_MARKSHEET")) || (requirement.document_type === "IDENTITY_DOCUMENT" && document.document_type === "DRIVING_LICENCE")));
  return <div className="mx-auto max-w-2xl space-y-6"><ApplicationProgress currentStep={2} /><div><p className="text-sm font-medium text-primary">Consent for {data.service.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Review information sharing</h1><p className="mt-2 leading-6 text-muted-foreground">Only the information listed below will be used for this application.</p></div><Card className="border-t-4 border-t-primary"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />Purpose</CardTitle></CardHeader><CardContent><p className="text-sm leading-6">{data.service.name} Application</p><p className="mt-1 text-sm text-muted-foreground">Recipient: {data.service.department}</p></CardContent></Card><Card><CardHeader><CardTitle>Profile information to share</CardTitle></CardHeader><CardContent><ul className="space-y-3">{[...data.service.required_profile_fields, ...data.service.fields.map((field) => field.key)].map((field) => <li key={field} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />{displayName(field)}</li>)}</ul></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />Documents requested</CardTitle></CardHeader><CardContent><ul className="space-y-3">{data.service.document_requirements.map((document) => <li key={document.id} className="flex items-center gap-2 text-sm"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />{document.label}{document.required ? <span className="text-xs text-muted-foreground">(required)</span> : null}</li>)}</ul>{matchingDocuments.length > 0 ? <fieldset className="mt-5 space-y-3 border-t border-border pt-4"><legend className="text-sm font-medium">Select DigiLocker documents to include</legend><p className="text-xs leading-5 text-muted-foreground">No document is pre-selected. Choose exactly what is included in this application.</p>{matchingDocuments.map((document) => <label key={document.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-primary/15 bg-blue-50/50 px-3 text-sm"><Checkbox isSelected={selectedDocumentIds.includes(document.id)} onChange={(isSelected) => setSelectedDocumentIds((current) => isSelected ? [...current, document.id] : current.filter((id) => id !== document.id))} />{document.name}</label>)}</fieldset> : null}</CardContent></Card><div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center"><LinkButton href={`/applications/${applicationId}/additional`} variant="outline" size="lg">Back</LinkButton><Button size="lg" onPress={grantConsent} isDisabled={submitting}>{submitting ? "Recording consent…" : "Give consent & continue"}</Button></div>{submitError ? <p role="alert" className="text-sm text-destructive">{submitError}</p> : null}</div>;
}
