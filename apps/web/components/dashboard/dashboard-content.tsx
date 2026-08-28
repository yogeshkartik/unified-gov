"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardList, FileText } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationStatus, ApplicationSummary, CitizenProfile, Document, GovernmentService } from "@/src/types";
import { applicationFlowPath, applicationFlowSteps } from "@/components/application/application-flow-navigation";
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

function applicationStatusLabel(status: ApplicationStatus) {
  if (actionableStatuses.includes(status)) return "Draft";
  if (status === "SUBMITTED") return "Submitted";
  if (status === "PROCESSING") return "Processing";
  if (status === "COMPLETED") return "Completed";
  if (status === "REJECTED") return "Rejected";
  return "Cancelled";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
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
  const draftCount = data.applications.filter((application) => actionableStatuses.includes(application.status)).length;
  const submittedCount = data.applications.filter((application) => !actionableStatuses.includes(application.status)).length;
  const recentApplications = data.applications.filter((application) => application.id !== nextApplication?.id).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 3);
  const firstName = data.profile.full_name.trim().split(/\s+/)[0] || "Citizen";

  return <div className="space-y-8">
    <header>
      <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome, {firstName}</h1>
    </header>

    {completion < 100 ? <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4" aria-labelledby="profile-action-heading"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 id="profile-action-heading" className="font-semibold text-amber-950">Complete your profile</h2><p className="mt-1 text-sm text-amber-900">Finish setting up your reusable details.</p></div><LinkButton href="/profile">Continue profile <ArrowRight aria-hidden="true" /></LinkButton></div></section> : nextApplication ? <section className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4" aria-labelledby="continue-application-heading"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><ClipboardList className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" /><div><h2 id="continue-application-heading" className="font-semibold text-amber-950">Continue application</h2><p className="mt-1 text-sm text-amber-900">{nextApplication.service_name} · Step {applicationFlowSteps[applicationStep(nextApplication.status)].index} of 5</p></div></div><div className="flex items-center gap-3"><LinkButton href="/applications" variant="link" size="sm" className="h-auto px-0 text-amber-900">View all applications</LinkButton><LinkButton href={applicationFlowPath(nextApplication.id, applicationStep(nextApplication.status))}>Continue <ArrowRight aria-hidden="true" /></LinkButton></div></div></section> : <section className="rounded-xl border bg-card px-5 py-4" aria-labelledby="apply-heading"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 id="apply-heading" className="font-semibold">Ready to apply?</h2><p className="mt-1 text-sm text-muted-foreground">Find a government service and start an application.</p></div><LinkButton href="/services">Browse services <ArrowRight aria-hidden="true" /></LinkButton></div></section>}

    <section className="grid gap-4 sm:grid-cols-2" aria-label="Profile and application status">
      <article className="rounded-xl border bg-card px-5 py-4"><div className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" /><h2 className="font-semibold">{completion === 100 ? "Profile ready" : "Profile incomplete"}</h2></div><p className="mt-2 text-sm text-muted-foreground">{completion === 100 ? "Your reusable details are ready for applications." : `${completion}% complete`}</p><LinkButton href="/profile" variant="link" size="sm" className="mt-3 h-auto px-0">{completion === 100 ? "View profile" : "Continue profile"} <ArrowRight aria-hidden="true" /></LinkButton></article>
      <article className="rounded-xl border bg-card px-5 py-4"><div className="flex items-center gap-2"><FileText className="size-5 text-primary" aria-hidden="true" /><h2 className="font-semibold">Applications</h2></div><p className="mt-2 text-sm text-muted-foreground">{draftCount} {draftCount === 1 ? "draft" : "drafts"} · {submittedCount} {submittedCount === 1 ? "submitted" : "submitted"}</p><LinkButton href="/applications" variant="link" size="sm" className="mt-3 h-auto px-0">View applications <ArrowRight aria-hidden="true" /></LinkButton></article>
    </section>

    {recentApplications.length > 0 ? <section aria-labelledby="recent-applications-heading"><div className="mb-3 flex items-end justify-between gap-3"><h2 id="recent-applications-heading" className="text-lg font-semibold">Recent applications</h2><LinkButton href="/applications" variant="link" size="sm" className="h-auto px-0">View all <ArrowRight aria-hidden="true" /></LinkButton></div><div className="overflow-hidden rounded-xl border bg-card">{recentApplications.map((application, index) => <article key={application.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${index > 0 ? "border-t" : ""}`}><div className="min-w-0"><h3 className="truncate text-sm font-medium">{application.service_name}</h3><p className="mt-1 text-xs text-muted-foreground">{applicationStatusLabel(application.status)} · {formatDate(application.updated_at)}</p></div>{actionableStatuses.includes(application.status) ? <LinkButton href={applicationFlowPath(application.id, applicationStep(application.status))} variant="link" size="sm" className="shrink-0">Continue <ArrowRight aria-hidden="true" /></LinkButton> : null}</article>)}</div></section> : null}

    <section aria-labelledby="services-heading"><div className="mb-3 flex items-end justify-between gap-3"><h2 id="services-heading" className="text-lg font-semibold">Explore services</h2><LinkButton href="/services" variant="link" size="sm" className="h-auto px-0">View all services <ArrowRight aria-hidden="true" /></LinkButton></div><div className="overflow-hidden rounded-xl border bg-card">{services.map((service, index) => <article key={service.id} className={`flex items-center justify-between gap-4 px-5 py-4 ${index > 0 ? "border-t" : ""}`}><div className="min-w-0"><h3 className="truncate text-sm font-medium">{service.name}</h3><p className="mt-1 text-xs text-muted-foreground">{service.category}</p></div><LinkButton href={`/services/${service.id}`} variant="link" size="sm" className="shrink-0">View <ArrowRight aria-hidden="true" /></LinkButton></article>)}</div></section>
  </div>;
}
