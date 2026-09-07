"use client";

import { useEffect, useMemo, useState } from "react";
import { ListFilter, Search } from "lucide-react";
import { api } from "@/src/lib/api";
import type { CitizenProfile, GovernmentService } from "@/src/types";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceCard } from "@/components/services/service-card";
import { useCitizenPreferences, type Language } from "@/components/providers/citizen-preferences";
import { localizeService } from "@/src/i18n/service-localization";
import { serviceDiscoveryText } from "@/src/i18n/service-discovery-localization";
import { jurisdictionName, profileStateToJurisdiction, serviceJurisdictions, type ServiceJurisdictionCode } from "@/src/i18n/jurisdictions";

const ALL_CATEGORIES = "__all_services__";

export function ServicesCatalog() {
  const { language, t } = useCitizenPreferences();
  const [services, setServices] = useState<GovernmentService[]>();
  const [jurisdiction, setJurisdiction] = useState<ServiceJurisdictionCode>();
  const [profileJurisdiction, setProfileJurisdiction] = useState<ServiceJurisdictionCode>();
  const [hasManuallyChangedJurisdiction, setHasManuallyChangedJurisdiction] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const searchMode = query.trim().length > 0;
  const globalSearch = jurisdiction === "IN" && searchMode;

  useEffect(() => {
    let active = true;
    api.getProfile()
      .then((profile) => {
        if (!active) return;
        const nextJurisdiction = profileStateToJurisdiction(currentAddressState(profile)) ?? "IN";
        setProfileJurisdiction(nextJurisdiction === "IN" ? undefined : nextJurisdiction);
        setJurisdiction(nextJurisdiction);
      })
      .catch(() => { if (active) setJurisdiction("IN"); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!jurisdiction) return;
    let active = true;
    api.getServices(jurisdiction, jurisdiction === "IN" && searchMode)
      .then((result) => { if (active) setServices(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [jurisdiction, searchMode]);

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
  if (!jurisdiction || !services) return <LoadingState label={t("loadingServices")} />;

  const discoveryText = (key: Parameters<typeof serviceDiscoveryText>[1], values?: Record<string, string | number>) => serviceDiscoveryText(language, key, values);
  const selectedLabel = categories.find((item) => item.value === category)?.label ?? t("allServices");
  const selectedJurisdictionName = jurisdictionName(jurisdiction, language);
  const centralServices = visibleServices.filter((service) => service.government_level === "CENTRAL");
  const stateServices = visibleServices.filter((service) => service.government_level !== "CENTRAL");
  const categoryIsActive = category !== null;
  const showProfileHint = !hasManuallyChangedJurisdiction && profileJurisdiction === jurisdiction;

  function changeQuery(nextQuery: string) {
    if (jurisdiction === "IN" && (nextQuery.trim().length > 0) !== searchMode) setServices(undefined);
    setQuery(nextQuery);
  }

  function changeJurisdiction(nextJurisdiction: ServiceJurisdictionCode) {
    setHasManuallyChangedJurisdiction(true);
    setServices(undefined);
    setError(false);
    setJurisdiction(nextJurisdiction);
  }

  return <div className="space-y-6"><div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5"><div className="grid gap-4 md:grid-cols-3 md:items-end"><div><Label htmlFor="service-search" className="text-foreground">{t("searchServices")}</Label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id="service-search" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder={t("searchServices")} className="min-h-11 border-border bg-background/80 pl-9 hover:border-foreground/25" /></div></div><div><Label htmlFor="service-jurisdiction">{t("servicesFor")}</Label><Select selectedKey={jurisdiction} onSelectionChange={(key) => changeJurisdiction(String(key) as ServiceJurisdictionCode)} aria-label={t("selectState")}><SelectTrigger id="service-jurisdiction" className="mt-2 min-h-11"><SelectValue>{selectedJurisdictionName}</SelectValue></SelectTrigger><SelectContent>{serviceJurisdictions.map((item) => <SelectItem id={item.code} key={item.code} textValue={jurisdictionName(item.code, language)}>{jurisdictionName(item.code, language)}</SelectItem>)}</SelectContent></Select>{showProfileHint ? <p className="mt-1.5 text-xs text-muted-foreground">{discoveryText("basedOnCurrentAddress")}</p> : null}</div><div><Label htmlFor="service-category" className="text-foreground">{t("category")}</Label><Select selectedKey={category ?? ALL_CATEGORIES} onSelectionChange={(key) => setCategory(String(key) === ALL_CATEGORIES ? null : String(key))} aria-label={t("category")}><SelectTrigger id="service-category" className={`mt-2 min-h-11 border bg-background/80 px-3 text-foreground hover:border-foreground/25 ${categoryIsActive ? "border-primary/50 bg-primary/5 hover:border-primary/70" : "border-border"}`}><ListFilter className={categoryIsActive ? "size-4 text-primary" : "size-4 text-muted-foreground"} aria-hidden="true" /><SelectValue>{selectedLabel}</SelectValue></SelectTrigger><SelectContent className="p-1"><SelectItem id={ALL_CATEGORIES} textValue={t("allServices")}>{t("allServices")}</SelectItem>{categories.map((item) => <SelectItem id={item.value} key={item.value} textValue={item.label}>{item.label} <span className="ml-auto text-muted-foreground">{item.count}</span></SelectItem>)}</SelectContent></Select></div></div></div><section aria-live="polite"><div className="mb-4 flex flex-wrap items-baseline justify-between gap-3"><div><h2 className="text-lg font-medium">{globalSearch ? discoveryText("searchResultsAcrossIndia") : `${t("servicesFor")}: ${selectedJurisdictionName}`}</h2>{globalSearch ? <p className="mt-1 text-sm text-muted-foreground">{discoveryText("showingMatchesAcrossSupportedStates")}</p> : null}</div><p className="text-sm text-muted-foreground">{visibleServices.length} {t(visibleServices.length === 1 ? "service" : "servicePlural")}</p></div>{visibleServices.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"><p className="font-medium">{t("noServicesForState", { state: selectedJurisdictionName })}</p><p className="mt-1 text-sm text-muted-foreground">{t("changeSearch")}</p></div> : globalSearch ? <GlobalSearchResults centralServices={centralServices} stateServices={stateServices} language={language} /> : <div className="space-y-8"><ServiceGroup title={t("centralGovernmentServices")} services={centralServices} />{jurisdiction !== "IN" ? <ServiceGroup title={t("stateGovernmentServices", { state: selectedJurisdictionName })} services={stateServices} /> : null}</div>}</section></div>;
}

function currentAddressState(profile: CitizenProfile): string | undefined {
  const current = profile.addresses.find((address) => address.type === "CORRESPONDENCE");
  const permanent = profile.addresses.find((address) => address.type === "PERMANENT");
  return (profile.current_address_same_as_permanent ? permanent : current)?.state;
}

function ServiceGroup({ title, services }: { title: string; services: GovernmentService[] }) {
  if (services.length === 0) return null;
  return <section className="space-y-3"><h3 className="border-b pb-2 text-base font-semibold">{title}</h3>{services.map((service) => <ServiceCard key={service.id} service={service} />)}</section>;
}

function GlobalSearchResults({ centralServices, stateServices, language }: { centralServices: GovernmentService[]; stateServices: GovernmentService[]; language: Language }) {
  const { t } = useCitizenPreferences();
  const groupedServices = new Map<string, GovernmentService[]>();
  for (const service of stateServices) {
    const key = service.service_key ?? service.id;
    groupedServices.set(key, [...(groupedServices.get(key) ?? []), service]);
  }
  return <div className="space-y-8"><ServiceGroup title={t("centralGovernmentServices")} services={centralServices} />{[...groupedServices.entries()].map(([serviceKey, variants]) => <StateServiceSearchGroup key={serviceKey} variants={variants} language={language} />)}</div>;
}

function StateServiceSearchGroup({ variants, language }: { variants: GovernmentService[]; language: Language }) {
  const title = groupedServiceTitle(variants[0], language);
  return <Card><CardHeader className="gap-1 pb-2"><CardTitle>{title}</CardTitle><p className="text-sm text-muted-foreground">{serviceDiscoveryText(language, "stateSpecificService")}</p></CardHeader><CardContent><p className="text-sm text-muted-foreground">{serviceDiscoveryText(language, "availableIn", { count: variants.length })}</p><div className="mt-3 flex flex-wrap gap-2">{variants.map((service) => { const state = jurisdictionName(service.jurisdiction_code, language); return <LinkButton key={service.id} href={`/services/${service.id}`} variant="outline" size="sm" aria-label={serviceDiscoveryText(language, "chooseStateFor", { state, service: title })}>{state}</LinkButton>; })}</div></CardContent></Card>;
}

function groupedServiceTitle(service: GovernmentService, language: Language): string {
  const localized = localizeService(service, language).name;
  const englishState = jurisdictionName(service.jurisdiction_code, "en");
  return localized.replace(new RegExp(`^${escapeRegExp(englishState)}\\s+`, "i"), "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
