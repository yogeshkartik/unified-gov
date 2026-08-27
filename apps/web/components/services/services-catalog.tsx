"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/src/lib/api";
import type { GovernmentService } from "@/src/types";
import { ErrorState, LoadingState, EmptyState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/services/service-card";

export function ServicesCatalog() {
  const [services, setServices] = useState<GovernmentService[]>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState(false);
  useEffect(() => { api.getServices().then(setServices).catch(() => setError(true)); }, []);
  const categories = useMemo(() => ["All", ...new Set((services ?? []).map((service) => service.category))], [services]);
  const visibleServices = useMemo(() => (services ?? []).filter((service) => (category === "All" || service.category === category) && `${service.name} ${service.department} ${service.description}`.toLowerCase().includes(query.toLowerCase())), [category, query, services]);
  if (error) return <ErrorState>The service catalog is unavailable. Start the demo API and refresh.</ErrorState>;
  if (!services) return <LoadingState label="Loading available services…" />;
  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><label className="relative block sm:max-w-sm sm:flex-1"><span className="sr-only">Search services</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" className="min-h-11 pl-9" /></label><div className="flex flex-wrap gap-2" aria-label="Filter services by category">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-10 rounded-full border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}>{item}</button>)}</div></div>{visibleServices.length === 0 ? <EmptyState>No services match your search.</EmptyState> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>}</div>;
}
