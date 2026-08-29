"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, FileText, GraduationCap, Landmark } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { api } from "@/src/lib/api";
import type { ApplicationSummary, CitizenProfile, Document, GovernmentService } from "@/src/types";
import { ApplicationStatusBadge } from "@/components/application/status-badge";
import { ErrorState } from "@/components/ui/data-state";
import { LinkButton } from "@/components/ui/button";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeService, localizeServiceName } from "@/src/i18n/service-localization";

type DashboardData = { profile: CitizenProfile; services: GovernmentService[]; documents: Document[]; applications: ApplicationSummary[] };
const actionableStatuses = new Set(["DRAFT", "ADDITIONAL_INFO_REQUIRED", "CONSENT_REQUIRED", "READY_FOR_REVIEW", "PAYMENT_REQUIRED"]);

function featuredServices(services: GovernmentService[]) {
  const sorted = [...services].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  const selected: GovernmentService[] = [];
  const selectedIds = new Set<string>();
  for (const service of sorted) { if (!selected.some((item) => item.category === service.category)) { selected.push(service); selectedIds.add(service.id); } if (selected.length === 4) return selected; }
  for (const service of sorted) { if (!selectedIds.has(service.id)) selected.push(service); if (selected.length === 4) break; }
  return selected;
}

function profileCompletion(profile: CitizenProfile, documents: Document[]) {
  const checks = [Boolean(profile.full_name && profile.date_of_birth && profile.gender && profile.nationality && profile.mobile && profile.email), profile.addresses.length > 0, documents.some((document) => document.document_type !== "PROFILE_PHOTO")];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function serviceIcon(category: string) {
  if (category.includes("Examination")) return GraduationCap;
  if (category.includes("Certificate")) return FileCheck2;
  if (category.includes("Identity") || category.includes("Licence")) return FileText;
  return Landmark;
}

function DashboardSkeleton() {
  return <div className="space-y-6 animate-pulse" aria-label="Loading dashboard"><div className="h-7 w-40 rounded bg-muted" /><div className="h-5 w-80 max-w-full rounded bg-muted" /><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-20 rounded-xl border bg-card" />)}</div><div className="h-44 rounded-xl border bg-card" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-xl border bg-card" />)}</div></div>;
}

function Reveal({ delay, children }: { delay: number; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={reduceMotion ? { duration: 0 } : { duration: 0.32, delay, ease: "easeOut" }}>{children}</motion.div>;
}

export function DashboardContent() {
  const { language, t } = useCitizenPreferences();
  const [data, setData] = useState<DashboardData>();
  const [error, setError] = useState(false);
  useEffect(() => { Promise.all([api.getProfile(), api.getServices(), api.getDocuments(), api.getApplications()]).then(([profile, services, documents, applications]) => setData({ profile, services, documents, applications })).catch(() => setError(true)); }, []);
  const localizedServices = useMemo(() => (data?.services ?? []).map((service) => localizeService(service, language)), [data?.services, language]);
  const popularServices = useMemo(() => featuredServices(localizedServices), [localizedServices]);
  if (error) return <ErrorState>{t("dashboardLoadError")}</ErrorState>;
  if (!data) return <DashboardSkeleton />;

  const completion = profileCompletion(data.profile, data.documents);
  const complete = completion === 100;
  const firstName = data.profile.full_name.trim().split(/\s+/)[0] || t("citizen");
  const documentCount = data.documents.filter((document) => document.document_type !== "PROFILE_PHOTO").length;
  const draftCount = data.applications.filter((application) => actionableStatuses.has(application.status)).length;
  const submittedCount = data.applications.length - draftCount;
  const recentApplications = [...data.applications].sort((first, second) => new Date(second.updated_at).getTime() - new Date(first.updated_at).getTime()).slice(0, 3);
  const serviceById = new Map(localizedServices.map((service) => [service.id, service]));
  const formatDate = (value: string) => new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" }).format(new Date(value));
  const applicationSummary = draftCount > 0 ? t("dashboardApplicationsWithDrafts", { drafts: draftCount, submitted: submittedCount }) : t("dashboardApplicationsSubmitted", { submitted: submittedCount });

  return <div className="space-y-6">
    <Reveal delay={0}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-medium text-muted-foreground">{t("dashboard")}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("welcome", { name: firstName })}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{complete ? t("dashboardReadyDescription") : t("dashboardIncompleteDescription", { completion })}</p></div>
        <LinkButton href="/services" className="shrink-0">{t("browseServices")} <ArrowRight aria-hidden="true" /></LinkButton>
      </header>
    </Reveal>

    <Reveal delay={0.08}>
      <section className="grid gap-3 sm:grid-cols-3" aria-label={t("dashboardSummary")}>
        <SummaryLink href="/profile" icon={CheckCircle2} title={complete ? t("profileReady") : t("profileIncomplete")} detail={t("completePercent", { completion })} action={complete ? t("view") : t("completeProfile")} tone={complete ? "text-emerald-600" : "text-amber-600"} />
        <SummaryLink href="/applications" icon={FileText} title={t("applications")} detail={applicationSummary} action={t("view")} tone="text-primary" />
        <SummaryLink href="/documents" icon={FileCheck2} title={t("documents")} detail={t("dashboardDocumentsSaved", { count: documentCount })} action={t("view")} tone="text-primary" />
      </section>
    </Reveal>

    <Reveal delay={0.16}>
      <section aria-labelledby="recent-applications-heading">
        <SectionHeader id="recent-applications-heading" title={t("recentApplications")} href="/applications" action={t("viewAll")} />
        {recentApplications.length === 0 ? <div className="rounded-xl border border-dashed bg-card px-5 py-6"><p className="font-medium">{t("dashboardNoApplications")}</p><p className="mt-1 text-sm text-muted-foreground">{t("dashboardNoApplicationsDescription")}</p><LinkButton href="/services" size="sm" className="mt-4">{t("browseServices")} <ArrowRight aria-hidden="true" /></LinkButton></div> : <div className="overflow-hidden rounded-xl border bg-card">{recentApplications.map((application, index) => { const service = serviceById.get(application.service_id); const serviceName = localizeServiceName(application.service_id, application.service_name, language); return <Link key={application.id} href={`/applications/${application.id}`} className={`group flex min-h-20 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5 ${index > 0 ? "border-t" : ""}`}><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{serviceName}</p><p className="mt-0.5 truncate text-xs text-muted-foreground">{service?.category ?? application.department}</p></div><div className="flex shrink-0 items-center gap-2 sm:gap-3"><ApplicationStatusBadge status={application.status} /><time className="hidden text-xs text-muted-foreground sm:block" dateTime={application.updated_at}>{formatDate(application.submitted_at ?? application.updated_at)}</time><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" /></div></Link>; })}</div>}
      </section>
    </Reveal>

    <Reveal delay={0.24}>
      <section aria-labelledby="popular-services-heading">
        <SectionHeader id="popular-services-heading" title={t("popularServices")} href="/services" action={t("viewAllServices")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{popularServices.map((service) => { const Icon = serviceIcon(service.category); return <Link key={service.id} href={`/services/${service.id}`} className="group flex min-h-28 flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start gap-2"><span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{service.name}</h3><p className="mt-0.5 truncate text-xs text-muted-foreground">{service.category}</p></div></div><span className="mt-auto flex items-center justify-end gap-1 text-xs font-medium text-primary">{t("view")} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" /></span></Link>; })}</div>
      </section>
    </Reveal>
  </div>;
}

function SummaryLink({ href, icon: Icon, title, detail, action, tone }: { href: string; icon: typeof CheckCircle2; title: string; detail: string; action: string; tone: string }) {
  return <Link href={href} className="group flex min-h-20 items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon className={`size-5 shrink-0 ${tone}`} aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="truncate text-xs text-muted-foreground">{detail}</p></div><span className="sr-only">{action}</span><ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5" aria-hidden="true" /></Link>;
}

function SectionHeader({ id, title, href, action }: { id: string; title: string; href: string; action: string }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 id={id} className="text-lg font-semibold">{title}</h2><LinkButton href={href} variant="link" size="sm" className="h-auto px-0">{action} <ArrowRight aria-hidden="true" /></LinkButton></div>;
}
