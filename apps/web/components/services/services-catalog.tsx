"use client";

import { useEffect, useMemo, useState } from "react";
import { ListFilter, Search, X } from "lucide-react";
import { api } from "@/src/lib/api";
import type { GovernmentService } from "@/src/types";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/services/service-card";
import { useCitizenPreferences, type Language } from "@/components/providers/citizen-preferences";
import { localizeService } from "@/src/i18n/service-localization";
import { serviceDiscoveryText } from "@/src/i18n/service-discovery-localization";
import { jurisdictionName, permanentAddressJurisdiction, serviceJurisdictions, type ServiceJurisdictionCode } from "@/src/i18n/jurisdictions";

const ALL_CATEGORIES = "__all_services__";
const CENTRAL_AND_HOME_STATE = "CENTRAL_AND_HOME_STATE";
const CENTRAL_ONLY = "CENTRAL";
type HomeState = Exclude<ServiceJurisdictionCode, "IN">;
type ServiceScope = typeof CENTRAL_AND_HOME_STATE | typeof CENTRAL_ONLY | HomeState;

export function ServicesCatalog() {
  const { language, t } = useCitizenPreferences();
  const [services, setServices] = useState<GovernmentService[]>();
  const [homeState, setHomeState] = useState<HomeState>();
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [scope, setScope] = useState<ServiceScope>(CENTRAL_AND_HOME_STATE);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const searchMode = query.trim().length > 0;
  const isDefaultScope = scope === CENTRAL_AND_HOME_STATE;
  const isCentralOnlyScope = scope === CENTRAL_ONLY;

  useEffect(() => {
    let active = true;
    api.getProfile()
      .then((profile) => {
        if (!active) return;
        const state = permanentAddressJurisdiction(profile);
        setHomeState(state && state !== "IN" ? state : undefined);
        setProfileLoaded(true);
      })
      .catch(() => { if (active) setProfileLoaded(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!profileLoaded) return;
    let active = true;
    const state = isDefaultScope ? homeState : isCentralOnlyScope ? "IN" : scope;
    api.getServices(state ?? "IN")
      .then((result) => { if (active) setServices(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [homeState, isCentralOnlyScope, isDefaultScope, profileLoaded, scope]);

  const catalogServices = useMemo(() => {
    const loadedServices = services ?? [];
    if (isDefaultScope) return loadedServices;
    if (isCentralOnlyScope) return loadedServices.filter((service) => service.government_level === "CENTRAL");
    return loadedServices.filter((service) => service.government_level === "STATE" && service.jurisdiction_code === scope);
  }, [isCentralOnlyScope, isDefaultScope, scope, services]);
  const localizedServices = useMemo(() => catalogServices.map((service) => localizeService(service, language)), [catalogServices, language]);
  const categories = useMemo(() => Array.from(new Set(catalogServices.map((service) => service.category)))
    .sort((first, second) => first.localeCompare(second))
    .map((value) => {
      const service = catalogServices.find((item) => item.category === value);
      return { value, label: service ? localizeService(service, language).category : value, count: catalogServices.filter((item) => item.category === value).length };
    }), [catalogServices, language]);
  const visibleServices = useMemo(() => localizedServices.filter((service) => {
    const canonical = catalogServices.find((item) => item.id === service.id);
    const searchable = `${service.name} ${service.department} ${service.category} ${service.description} ${canonical?.name ?? ""} ${canonical?.description ?? ""} ${service.service_key ?? ""}`;
    return (category === null || canonical?.category === category) && searchable.toLocaleLowerCase(language).includes(query.trim().toLocaleLowerCase(language));
  }), [catalogServices, category, language, localizedServices, query]);

  if (error) return <ErrorState>{t("catalogUnavailable")}</ErrorState>;
  if (!profileLoaded || !services) return <LoadingState label={t("loadingServices")} />;

  const selectedLabel = categories.find((item) => item.value === category)?.label ?? t("allServices");
  const centralServices = visibleServices.filter((service) => service.government_level === "CENTRAL");
  const stateServices = visibleServices.filter((service) => service.government_level === "STATE");
  const categoryIsActive = category !== null;

  function changeScope(nextScope: ServiceScope) {
    setScope(nextScope);
    setError(false);
    setServices(undefined);
  }

  function clearQuery() {
    setQuery("");
    document.getElementById("service-search")?.focus();
  }

  return <div className="space-y-6">
    <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-3 md:items-end">
        <div>
          <Label htmlFor="service-search" className="text-foreground">{t("searchServices")}</Label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="service-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchServices")} className="min-h-11 border-border bg-background/80 py-2 pr-11 pl-9 hover:border-foreground/25" />
            {query ? <Button variant="ghost" size="icon-sm" onPress={clearQuery} aria-label={serviceDiscoveryText(language, "clearSearch")} className="absolute right-1 top-1/2 -translate-y-1/2"><X aria-hidden="true" /></Button> : null}
          </div>
        </div>
        <div>
          <Label htmlFor="service-jurisdiction">{serviceDiscoveryText(language, "browseServices")}</Label>
          <Select selectedKey={scope} onSelectionChange={(key) => changeScope(String(key) as ServiceScope)} aria-label={serviceDiscoveryText(language, "browseServices")}>
            <SelectTrigger id="service-jurisdiction" className="mt-2 min-h-11"><SelectValue>{isDefaultScope ? serviceDiscoveryText(language, "centralAndStateServices") : isCentralOnlyScope ? t("centralGovernment") : jurisdictionName(scope, language)}</SelectValue></SelectTrigger>
            <SelectContent><SelectItem id={CENTRAL_AND_HOME_STATE} textValue={serviceDiscoveryText(language, "centralAndStateServices")}>{serviceDiscoveryText(language, "centralAndStateServices")}</SelectItem><SelectItem id={CENTRAL_ONLY} textValue={t("centralGovernment")}>{t("centralGovernment")}</SelectItem>{serviceJurisdictions.filter((item) => item.code !== "IN").map((item) => <SelectItem id={item.code} key={item.code} textValue={jurisdictionName(item.code, language)}>{jurisdictionName(item.code, language)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="service-category" className="text-foreground">{t("category")}</Label>
          <Select selectedKey={category ?? ALL_CATEGORIES} onSelectionChange={(key) => setCategory(String(key) === ALL_CATEGORIES ? null : String(key))} aria-label={t("category")}>
            <SelectTrigger id="service-category" className={`mt-2 min-h-11 border bg-background/80 px-3 text-foreground hover:border-foreground/25 ${categoryIsActive ? "border-primary/50 bg-primary/5 hover:border-primary/70" : "border-border"}`}><ListFilter className={categoryIsActive ? "size-4 text-primary" : "size-4 text-muted-foreground"} aria-hidden="true" /><SelectValue>{selectedLabel}</SelectValue></SelectTrigger>
            <SelectContent className="p-1"><SelectItem id={ALL_CATEGORIES} textValue={t("allServices")}>{t("allServices")}</SelectItem>{categories.map((item) => <SelectItem id={item.value} key={item.value} textValue={item.label}>{item.label} <span className="ml-auto text-muted-foreground">{item.count}</span></SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
    </div>
    <section aria-live="polite">
      {visibleServices.length === 0 ? <EmptyResults /> : searchMode ? <SearchResults language={language} query={query.trim()} services={visibleServices} /> : isDefaultScope ? <DefaultBrowseResults centralServices={centralServices} stateServices={stateServices} state={homeState} language={language} /> : isCentralOnlyScope ? <ServiceGroup title={t("centralGovernmentServices")} services={centralServices} /> : <ServiceGroup title={t("stateGovernmentServices", { state: jurisdictionName(scope, language) })} services={stateServices} />}
    </section>
  </div>;
}

function DefaultBrowseResults({ centralServices, stateServices, state, language }: { centralServices: GovernmentService[]; stateServices: GovernmentService[]; state?: HomeState; language: Language }) {
  const { t } = useCitizenPreferences();
  return <div className="space-y-8"><ServiceGroup title={t("centralGovernmentServices")} services={centralServices} />{state ? <ServiceGroup title={t("stateGovernmentServices", { state: jurisdictionName(state, language) })} services={stateServices} /> : <MissingStateHelper language={language} />}</div>;
}

function SearchResults({ language, query, services }: { language: Language; query: string; services: GovernmentService[] }) {
  return <div className="space-y-3"><div><h2 className="text-lg font-medium">{serviceDiscoveryText(language, "searchResultsFor", { query })}</h2><p className="mt-1 text-sm text-muted-foreground">{serviceDiscoveryText(language, "matchingServices", { count: services.length })}</p></div>{services.map((service) => <ServiceCard key={service.id} service={service} />)}</div>;
}

function MissingStateHelper({ language }: { language: Language }) {
  return <section className="rounded-xl border border-dashed border-border bg-card px-6 py-5"><h3 className="font-semibold">{serviceDiscoveryText(language, "stateGovernmentServices")}</h3><p className="mt-1 text-sm text-muted-foreground">{serviceDiscoveryText(language, "chooseStateToExplore")}</p></section>;
}

function ServiceGroup({ title, services }: { title: string; services: GovernmentService[] }) {
  if (services.length === 0) return null;
  return <section className="space-y-3"><div className="flex items-baseline justify-between gap-3 border-b pb-2"><h3 className="text-base font-semibold">{title}</h3><p className="text-sm text-muted-foreground">{services.length}</p></div>{services.map((service) => <ServiceCard key={service.id} service={service} />)}</section>;
}

function EmptyResults() {
  const { t } = useCitizenPreferences();
  return <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"><p className="font-medium">{t("noServicesFound")}</p><p className="mt-1 text-sm text-muted-foreground">{t("changeSearch")}</p></div>;
}
