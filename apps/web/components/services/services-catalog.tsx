"use client";

import { useEffect, useMemo, useState } from "react";
import { ListFilter, Search } from "lucide-react";
import { api } from "@/src/lib/api";
import type { GovernmentService } from "@/src/types";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceCard } from "@/components/services/service-card";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeService } from "@/src/i18n/service-localization";
import { jurisdictionName, serviceJurisdictions, type ServiceJurisdictionCode } from "@/src/i18n/jurisdictions";

const ALL_CATEGORIES = "__all_services__";

export function ServicesCatalog() {
  const { language, t } = useCitizenPreferences();
  const [services, setServices] = useState<GovernmentService[]>();
  const [jurisdiction, setJurisdiction] = useState<ServiceJurisdictionCode>("IN");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    api.getServices(jurisdiction).then((result) => { if (active) setServices(result); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [jurisdiction]);
  const localizedServices = useMemo(() => (services ?? []).map((service) => localizeService(service, language)), [language, services]);
  const categories = useMemo(() => Array.from(new Set((services ?? []).map((service) => service.category))).sort((first, second) => first.localeCompare(second)).map((value) => {
    const service = services?.find((item) => item.category === value);
    return { value, label: service ? localizeService(service, language).category : value, count: services?.filter((item) => item.category === value).length ?? 0 };
  }), [language, services]);
  const visibleServices = useMemo(() => localizedServices.filter((service) => {
    const canonical = services?.find((item) => item.id === service.id);
    const searchable = `${service.name} ${service.department} ${service.category} ${service.description} ${canonical?.name ?? ""} ${canonical?.description ?? ""} ${service.service_key ?? ""}`;
    return (category === null || canonical?.category === category) && searchable.toLocaleLowerCase(language).includes(query.toLocaleLowerCase(language));
  }), [category, language, localizedServices, query, services]);
  if (error) return <ErrorState>{t("catalogUnavailable")}</ErrorState>;
  if (!services) return <LoadingState label={t("loadingServices")} />;
  const selectedLabel = categories.find((item) => item.value === category)?.label ?? t("allServices");
  const selectedJurisdictionName = jurisdictionName(jurisdiction, language);
  const centralServices = visibleServices.filter((service) => service.government_level === "CENTRAL");
  const stateServices = visibleServices.filter((service) => service.government_level !== "CENTRAL");

  const categoryIsActive = category !== null;

  return <div className="space-y-6"><div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5"><div className="grid gap-4 md:grid-cols-3 md:items-end"><div><Label htmlFor="service-search" className="text-foreground">{t("searchServices")}</Label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="service-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchServices")} className="min-h-11 border-border bg-background/80 pl-9 hover:border-foreground/25" /></div></div><div><Label htmlFor="service-jurisdiction">{t("servicesFor")}</Label><Select selectedKey={jurisdiction} onSelectionChange={(key) => { setServices(undefined); setError(false); setJurisdiction(String(key) as ServiceJurisdictionCode); setCategory(null); }} aria-label={t("selectState")}><SelectTrigger id="service-jurisdiction" className="mt-2 min-h-11"><SelectValue>{selectedJurisdictionName}</SelectValue></SelectTrigger><SelectContent>{serviceJurisdictions.map((item) => <SelectItem id={item.code} key={item.code}>{jurisdictionName(item.code, language)}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="service-category" className="text-foreground">{t("category")}</Label><Select selectedKey={category ?? ALL_CATEGORIES} onSelectionChange={(key) => setCategory(String(key) === ALL_CATEGORIES ? null : String(key))} aria-label={t("category")}><SelectTrigger id="service-category" className={`mt-2 min-h-11 border bg-background/80 px-3 text-foreground hover:border-foreground/25 ${categoryIsActive ? "border-primary/50 bg-primary/5 hover:border-primary/70" : "border-border"}`}><ListFilter className={categoryIsActive ? "size-4 text-primary" : "size-4 text-muted-foreground"} aria-hidden="true" /><SelectValue>{selectedLabel}</SelectValue></SelectTrigger><SelectContent className="p-1"><SelectItem id={ALL_CATEGORIES} textValue={t("allServices")}>{t("allServices")}</SelectItem>{categories.map((item) => <SelectItem id={item.value} key={item.value} textValue={item.label}>{item.label} <span className="ml-auto text-muted-foreground">{item.count}</span></SelectItem>)}</SelectContent></Select></div></div></div><section aria-live="polite"><div className="mb-4 flex items-baseline justify-between gap-3"><h2 className="text-lg font-medium">{t("servicesFor")}: {selectedJurisdictionName}</h2><p className="text-sm text-muted-foreground">{visibleServices.length} {t(visibleServices.length === 1 ? "service" : "servicePlural")}</p></div>{visibleServices.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"><p className="font-medium">{t("noServicesForState", { state: selectedJurisdictionName })}</p><p className="mt-1 text-sm text-muted-foreground">{t("changeSearch")}</p></div> : <div className="space-y-8"><ServiceGroup title={t("centralGovernmentServices")} services={centralServices} />{jurisdiction !== "IN" ? <ServiceGroup title={t("stateGovernmentServices", { state: selectedJurisdictionName })} services={stateServices} /> : null}</div>}</section></div>;
}

function ServiceGroup({ title, services }: { title: string; services: GovernmentService[] }) {
  if (services.length === 0) return null;
  return <section className="space-y-3"><h3 className="border-b pb-2 text-base font-semibold">{title}</h3>{services.map((service) => <ServiceCard key={service.id} service={service} />)}</section>;
}
