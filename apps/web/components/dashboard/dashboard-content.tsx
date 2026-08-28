"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Circle, ClipboardList, Search, ShieldCheck, UserRound } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationStatus, ApplicationSummary, CitizenProfile, Document, GovernmentService } from "@/src/types";
import { applicationFlowPath } from "@/components/application/application-flow-navigation";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/service-card";

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
    if (selected.length === 6) return selected;
  }
  for (const service of sorted) { if (!selectedIds.has(service.id)) selected.push(service); if (selected.length === 6) break; }
  return selected;
}

function profileChecks(profile: CitizenProfile, documents: Document[]) {
  return [
    { label: "Personal details", complete: Boolean(profile.full_name && profile.date_of_birth && profile.gender && profile.nationality) },
    { label: "Contact details", complete: Boolean(profile.mobile && profile.email) },
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
    <section className="rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-7 text-primary-foreground shadow-md sm:px-8"><p className="text-sm font-medium text-blue-100">Unified Services</p><h1 className="mt-1 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Government services, made simpler</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">Find, apply for, and track services using one reusable citizen profile. Your details and documents are shared only with your consent.</p><div className="mt-5 flex flex-wrap gap-3"><LinkButton href="/services" size="lg" className="bg-background text-primary hover:bg-blue-50">Browse services <ArrowRight aria-hidden="true" /></LinkButton><LinkButton href="/profile" size="lg" variant="outline" className="border-blue-200 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">My profile</LinkButton></div></section>

    {nextApplication ? <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm" aria-labelledby="continue-application-heading"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><ClipboardList className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" /><div><h2 id="continue-application-heading" className="font-semibold text-amber-950">Continue your application</h2><p className="mt-1 text-sm text-amber-900">{nextApplication.service_name} needs your attention.</p></div></div><LinkButton href={applicationFlowPath(nextApplication.id, applicationStep(nextApplication.status))} size="lg">Continue <ArrowRight aria-hidden="true" /></LinkButton></div></section> : null}

    <section className="grid gap-4 lg:grid-cols-3" aria-label="Profile status and how Unified Services works"><Card className="border-t-4 border-t-emerald-500 bg-gradient-to-br from-emerald-50/80 to-card"><CardHeader className="pb-2"><CardTitle>Profile progress</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-emerald-700">{completion}%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${completion}%` }} /></div><ul className="mt-4 space-y-2 text-sm">{checks.map((check) => <li key={check.label} className="flex items-center gap-2">{check.complete ? <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" /> : <Circle className="size-4 text-muted-foreground" aria-hidden="true" />}{check.label}</li>)}</ul><LinkButton href="/profile" variant="link" size="sm" className="mt-4 h-auto px-0">{completion === 100 ? "View profile" : "Complete profile"} <ArrowRight aria-hidden="true" /></LinkButton></CardContent></Card><Card className="lg:col-span-2"><CardHeader className="pb-2"><CardTitle>How it works</CardTitle><p className="text-sm text-muted-foreground">One profile helps you complete applications with less repeated entry.</p></CardHeader><CardContent className="grid gap-5 sm:grid-cols-3">{[{ icon: UserRound, title: "Complete your profile", text: "Keep your contact details, address, and documents ready." }, { icon: Search, title: "Choose a service", text: "Browse participating government departments and requirements." }, { icon: ShieldCheck, title: "Review and consent", text: "Confirm what is shared before you submit an application." }].map(({ icon: Icon, title, text }) => <div key={title} className="space-y-2"><Icon className="size-5 text-primary" aria-hidden="true" /><h3 className="font-medium">{title}</h3><p className="text-sm leading-6 text-muted-foreground">{text}</p></div>)}</CardContent></Card></section>

    <section aria-labelledby="services-heading"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="services-heading" className="text-xl font-semibold">Explore services</h2><p className="mt-1 text-sm text-muted-foreground">Start with services from participating government departments.</p></div><LinkButton href="/services" variant="outline" className="w-fit">View all services <ArrowRight aria-hidden="true" /></LinkButton></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{services.map((service) => <ServiceCard key={service.id} service={service} />)}</div></section>
  </div>;
}
