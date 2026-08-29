"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/src/lib/api";
import type { GovernmentService } from "@/src/types";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceCard } from "@/components/services/service-card";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeService } from "@/src/i18n/service-localization";

const ALL_CATEGORIES = "__all_services__";

export function ServicesCatalog() {
  const { language, t } = useCitizenPreferences();
  const [services, setServices] = useState<GovernmentService[]>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { api.getServices().then(setServices).catch(() => setError(true)); }, []);
  const localizedServices = useMemo(() => (services ?? []).map((service) => localizeService(service, language)), [language, services]);
  const categories = useMemo(() => Array.from(new Set(localizedServices.map((service) => service.category))).sort((first, second) => first.localeCompare(second)).map((name) => ({ name, count: localizedServices.filter((service) => service.category === name).length })), [localizedServices]);
  const visibleServices = useMemo(() => localizedServices.filter((service) => (category === null || service.category === category) && `${service.name} ${service.department} ${service.category} ${service.description}`.toLocaleLowerCase(language).includes(query.toLocaleLowerCase(language))), [category, language, localizedServices, query]);
  if (error) return <ErrorState>{t("catalogUnavailable")}</ErrorState>;
  if (!services) return <LoadingState label={t("loadingServices")} />;
  const selectedLabel = category ?? t("allServices");

  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_16rem] sm:items-end"><label className="relative block"><span className="sr-only">{t("searchServices")}</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchServices")} className="min-h-11 pl-9" /></label><div><Label htmlFor="service-category">{t("category")}</Label><Select selectedKey={category ?? ALL_CATEGORIES} onSelectionChange={(key) => setCategory(String(key) === ALL_CATEGORIES ? null : String(key))} aria-label={t("category")}><SelectTrigger id="service-category" className="mt-2 min-h-11"><SelectValue>{selectedLabel} ({category === null ? services.length : categories.find((item) => item.name === category)?.count ?? 0})</SelectValue></SelectTrigger><SelectContent>{<SelectItem id={ALL_CATEGORIES} textValue={t("allServices")}>{t("allServices")} <span className="ml-auto text-muted-foreground">{services.length}</span></SelectItem>}{categories.map((item) => <SelectItem id={item.name} key={item.name} textValue={item.name}>{item.name} <span className="ml-auto text-muted-foreground">{item.count}</span></SelectItem>)}</SelectContent></Select></div></div><section aria-labelledby="services-heading"><div className="mb-3 flex items-baseline justify-between gap-3"><h2 id="services-heading" className="text-lg font-medium">{selectedLabel}</h2><p className="text-sm text-muted-foreground">{visibleServices.length} {t(visibleServices.length === 1 ? "service" : "servicePlural")}</p></div>{visibleServices.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"><p className="font-medium">{t("noServicesFound")}</p><p className="mt-1 text-sm text-muted-foreground">{t("changeSearch")}</p></div> : <div className="space-y-3">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>}</section></div>;
}
