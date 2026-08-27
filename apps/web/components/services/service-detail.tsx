"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckCircle2, FileText, IndianRupee, Landmark, LoaderCircle, UserRound } from "lucide-react";
import { api } from "@/src/lib/api";
import { saveApplication } from "@/src/lib/application-store";
import type { GovernmentServiceDetail } from "@/src/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { ApplicationProgress } from "@/components/application/application-progress";

function formatFieldName(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function ServiceDetail({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [service, setService] = useState<GovernmentServiceDetail>();
  const [error, setError] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string>();

  useEffect(() => {
    api.getService(serviceId).then(setService).catch(() => setError(true));
  }, [serviceId]);

  async function apply() {
    setApplying(true);
    setApplyError(undefined);
    try {
      const application = await api.createApplication(serviceId);
      if (service) saveApplication({ id: application.id, service_id: service.id, service_name: service.name, status: application.status, fee: service.fee, currency: service.currency, created_at: application.created_at });
      router.push(application.missing_fields.length === 0 ? `/applications/${application.id}/consent` : `/applications/${application.id}/additional`);
    } catch {
      setApplyError("We could not create your application. Please try again.");
      setApplying(false);
    }
  }

  if (error) return <ErrorState>This service could not be loaded. Return to the service catalog and try again.</ErrorState>;
  if (!service) return <LoadingState label="Loading service details…" />;

  const deadline = service.end_date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(service.end_date)) : "No deadline specified";
  const fee = service.fee > 0 ? `${service.currency} ${service.fee}` : "No application fee";

  return (
    <div className="space-y-6">
      <ApplicationProgress currentStep={1} />
      <section className="rounded-xl border border-primary/15 bg-gradient-to-br from-blue-50/70 to-card p-5 shadow-sm sm:p-7">
        <p className="text-sm font-medium text-primary">{service.category}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{service.name}</h1>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Landmark className="size-4" aria-hidden="true" />{service.department}</p>
        <p className="mt-5 max-w-3xl leading-7 text-muted-foreground">{service.description}</p>
        <dl className="mt-6 grid gap-4 border-t border-primary/10 pt-5 sm:grid-cols-2">
          <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"><IndianRupee className="size-3.5" aria-hidden="true" />Application fee</dt><dd className="mt-1 font-medium">{fee}</dd></div>
          <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden="true" />Deadline</dt><dd className="mt-1 font-medium">{deadline}</dd></div>
        </dl>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" onPress={apply} isDisabled={applying}>{applying ? <><LoaderCircle className="animate-spin" aria-hidden="true" />Creating application…</> : "Apply now"}</Button>
          <p className="text-xs leading-5 text-muted-foreground">This creates a draft that you can review before submission.</p>
        </div>
        {applyError ? <p role="alert" className="mt-3 text-sm text-destructive">{applyError}</p> : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-t-4 border-t-emerald-500"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />Eligibility</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Eligibility is assessed from the service requirements when you create an application.</p></CardContent></Card>
        <Card className="border-t-4 border-t-primary"><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-primary" aria-hidden="true" />Information reused from your profile</CardTitle></CardHeader><CardContent><ul className="space-y-2 text-sm">{service.required_profile_fields.map((field) => <li key={field} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />{formatFieldName(field)}</li>)}</ul></CardContent></Card>
        <Card className="border-t-4 border-t-violet-500"><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-violet-600" aria-hidden="true" />Required documents</CardTitle></CardHeader><CardContent><ul className="space-y-3 text-sm">{service.document_requirements.sort((a, b) => a.position - b.position).map((document) => <li key={document.id} className="flex items-start justify-between gap-3"><span>{document.label}</span><span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">{document.required ? "Required" : "Optional"}</span></li>)}</ul></CardContent></Card>
        <Card className="border-t-4 border-t-amber-500"><CardHeader><CardTitle>Additional information required</CardTitle></CardHeader><CardContent>{service.fields.length === 0 ? <p className="text-sm text-muted-foreground">No additional information is required. You will continue to consent after applying.</p> : <ul className="space-y-3 text-sm">{service.fields.sort((a, b) => a.position - b.position).map((field) => <li key={field.id}><p className="font-medium">{field.label}{field.required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}</p><p className="text-xs text-muted-foreground">{formatFieldName(field.field_type)}</p></li>)}</ul>}</CardContent></Card>
      </div>
    </div>
  );
}
