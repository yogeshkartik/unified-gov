"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CheckCircle2, ClipboardList, Search, UserRound } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationStatus, ApplicationSummary, CitizenProfile, Document, GovernmentService } from "@/src/types";
import { applicationFlowPath } from "@/components/application/application-flow-navigation";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { LinkButton } from "@/components/ui/button";

type DashboardData = { profile: CitizenProfile; services: GovernmentService[]; documents: Document[]; applications: ApplicationSummary[] };
const actionableStatuses: ApplicationStatus[] = ["DRAFT", "ADDITIONAL_INFO_REQUIRED", "CONSENT_REQUIRED", "READY_FOR_REVIEW", "PAYMENT_REQUIRED"];

function applicationStep(status: ApplicationStatus) {
  if (status === "ADDITIONAL_INFO_REQUIRED") return "additional" as const;
  if (status === "DRAFT" || status === "CONSENT_REQUIRED") return "consent" as const;
  if (status === "PAYMENT_REQUIRED") return "payment" as const;
  return "preview" as const;
}

function featuredServices(services: GovernmentService[]) {
  const sorted = [...services].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const selected: GovernmentService[] = [];
  const selectedIds = new Set<string>();
  for (const service of sorted) {
    if (!selected.some((item) => item.category === service.category)) { selected.push(service); selectedIds.add(service.id); }
    if (selected.length === 4) return selected;
  }
  for (const service of sorted) { if (!selectedIds.has(service.id)) selected.push(service); if (selected.length === 4) break; }
  return selected;
}

function profileChecks(profile: CitizenProfile, documents: Document[]) {
  return [
    { label: "Personal details", complete: Boolean(profile.full_name && profile.date_of_birth && profile.gender && profile.nationality && profile.mobile && profile.email) },
    { label: "Address", complete: profile.addresses.length > 0 },
    { label: "Documents", complete: documents.length > 0 },
  ];
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState(false);
  useEffect(() => { Promise.all([api.getProfile(), api.getServices(), api.getDocuments(), api.getApplications()]).then(([profile, services, documents, applications]) => setData({ profile, services, documents, applications })).catch(() => setError(true)); }, []);
  const services = useMemo(() => (data ? featuredServices(data.services) : []), [data]);
  if (error) return <ErrorState>The dashboard could not reach the service API. Refresh and try again.</ErrorState>;
  if (!data) return <LoadingState label="Loading your dashboard…" />;
  const checks = profileChecks(data.profile, data.documents);
  const completion = Math.round((checks.filter((check) => check.complete).length / checks.length) * 100);
  const nextApplication = data.applications.filter((application) => application.requires_action || actionableStatuses.includes(application.status)).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

  return <div className="space-y-8">
    <section className="rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-7 text-primary-foreground shadow-md sm:px-8">
      <p className="text-sm font-medium text-blue-100">Unified Services</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Apply for government services with one reusable profile.</h1>
      <p className="mt-2 text-sm text-blue-100 sm:text-base">Save your details once, then reuse them across applications.</p>
      <div className="mt-5 flex flex-wrap gap-3"><LinkButton href="/services" size="lg" className="bg-background text-primary hover:bg-blue-50">Browse services <ArrowRight aria-hidden="true" /></LinkButton><LinkButton href="/profile" size="lg" variant="outline" className="border-blue-200 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">My profile</LinkButton></div>
    </section>

    {nextApplication ? <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm" aria-labelledby="continue-application-heading"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><ClipboardList className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" /><div><h2 id="continue-application-heading" className="font-semibold text-amber-950">Continue your application</h2><p className="mt-1 text-sm text-amber-900">{nextApplication.service_name} needs your attention.</p></div></div><LinkButton href={applicationFlowPath(nextApplication.id, applicationStep(nextApplication.status))} size="lg">Continue <ArrowRight aria-hidden="true" /></LinkButton></div></section> : null}

    <section aria-labelledby="how-it-works-heading"><h2 id="how-it-works-heading" className="text-lg font-semibold">How it works</h2><ol className="mt-3 grid divide-y rounded-xl border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">{[{ icon: UserRound, label: "Save your details" }, { icon: Search, label: "Choose a service" }, { icon: CheckCircle2, label: "Review & submit" }].map(({ icon: Icon, label }, index) => <li key={label} className="flex items-center gap-3 px-4 py-4"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span><Icon className="size-4 text-primary" aria-hidden="true" /><span className="text-sm font-medium">{label}</span></li>)}</ol></section>

    <section className="flex flex-col gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between" aria-labelledby="profile-heading"><div><div className="flex items-center gap-2"><h2 id="profile-heading" className="font-semibold">{completion === 100 ? "Profile ready" : "Profile incomplete"}</h2><span className="text-sm font-medium text-emerald-700">{completion}%</span></div>{completion === 100 ? <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">{checks.map((check) => <li key={check.label} className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald-600" aria-hidden="true" />{check.label}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Complete your profile before applying.</p>}</div><LinkButton href="/profile" variant={completion === 100 ? "outline" : "default"} className="w-fit">{completion === 100 ? "View profile" : "Complete profile"} <ArrowRight aria-hidden="true" /></LinkButton></section>

    <section aria-labelledby="services-heading"><div className="mb-4 flex items-end justify-between gap-3"><h2 id="services-heading" className="text-xl font-semibold">Popular services</h2><LinkButton href="/services" variant="link" size="sm" className="h-auto px-0">View all services <ArrowRight aria-hidden="true" /></LinkButton></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{services.map((service) => <article key={service.id} className="rounded-xl border bg-card p-4 shadow-sm"><h3 className="font-semibold leading-5">{service.name}</h3><p className="mt-2 text-xs font-medium text-primary">{service.category}</p><p className="mt-1 truncate text-sm text-muted-foreground">{service.department}</p><LinkButton href={`/services/${service.id}`} variant="link" size="sm" className="mt-3 h-auto px-0">View <ArrowRight aria-hidden="true" /></LinkButton></article>)}</div></section>
  </div>;
}
