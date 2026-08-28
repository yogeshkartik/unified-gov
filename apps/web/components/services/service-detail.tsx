"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Landmark, LoaderCircle } from "lucide-react";
import { api } from "@/src/lib/api";
import type { GovernmentServiceDetail } from "@/src/types";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCitizenAuth } from "@/components/providers/citizen-auth";

function formatFieldName(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function ServiceDetail({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [service, setService] = useState<GovernmentServiceDetail>();
  const [error, setError] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string>();
  const { session } = useCitizenAuth();

  useEffect(() => {
    api.getService(serviceId).then(setService).catch(() => setError(true));
  }, [serviceId]);

  async function apply() {
    setApplying(true);
    setApplyError(undefined);
    try {
      const application = await api.createApplication(serviceId);
      router.push(application.missing_fields.length === 0 ? `/applications/${application.id}/consent` : `/applications/${application.id}/additional`);
    } catch {
      setApplyError("We could not create your application. Please try again.");
      setApplying(false);
    }
  }

  if (error) return <ErrorState>This service could not be loaded. Return to the service catalog and try again.</ErrorState>;
  if (!service) return <LoadingState label="Loading service details…" />;

  const deadline = service.end_date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(service.end_date)) : "No deadline";
  const fee = service.fee > 0 ? `${new Intl.NumberFormat("en-IN", { style: "currency", currency: service.currency, maximumFractionDigits: 0 }).format(service.fee)} fee` : "No application fee";
  const requiredDocuments = [...service.document_requirements]
    .filter((document) => document.required)
    .sort((a, b) => a.position - b.position);
  const additionalFields = [...service.fields].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-blue-50/70 to-card p-5 shadow-sm sm:p-7">
        <p className="text-sm font-medium text-primary">{service.category}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{service.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Landmark className="size-4" aria-hidden="true" />{service.department}</p>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{service.description}</p>
        <p className="mt-5 text-sm font-medium text-muted-foreground"><span>{fee}</span><span className="mx-2" aria-hidden="true">•</span><span>{deadline}</span></p>
        <div className="mt-6">
          {session ? <Button size="lg" onPress={apply} isDisabled={applying}>{applying ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Creating application…</> : "Apply now"}</Button> : <LinkButton href={`/login?returnTo=${encodeURIComponent(`/services/${serviceId}`)}`} size="lg">Sign in to apply</LinkButton>}
        </div>
        {applyError ? <p role="alert" className="mt-3 text-sm text-destructive">{applyError}</p> : null}
      </section>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">What you&apos;ll need</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <section aria-labelledby="profile-requirements-heading">
            <h2 id="profile-requirements-heading" className="text-sm font-medium">From your profile</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{service.required_profile_fields.map((field) => <li key={field} className="flex items-center gap-2"><CheckCircle2 className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />{formatFieldName(field)}</li>)}</ul>
          </section>
          <section aria-labelledby="document-requirements-heading">
            <h2 id="document-requirements-heading" className="text-sm font-medium">Documents</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{requiredDocuments.map((document) => <li key={document.id} className="flex items-center gap-2"><FileText className="size-4 shrink-0" aria-hidden="true" />{document.label}</li>)}</ul>
          </section>
          <section aria-labelledby="additional-requirements-heading">
            <h2 id="additional-requirements-heading" className="text-sm font-medium">Additional information</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">{additionalFields.map((field) => <li key={field.id} className="flex items-center gap-2"><span className="text-base leading-none" aria-hidden="true">•</span>{field.label}</li>)}</ul>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
