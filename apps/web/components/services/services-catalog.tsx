"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "@/src/lib/api";
import type { GovernmentService } from "@/src/types";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
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
  if (error) return <ErrorState>The service catalog is unavailable. Start the service API and refresh.</ErrorState>;
  if (!services) return <LoadingState label="Loading available services…" />;
  return <div className="space-y-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><label className="relative block lg:max-w-sm lg:flex-1"><span className="sr-only">Search services</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" className="min-h-11 pl-9" /></label><div className="flex flex-wrap gap-2" aria-label="Filter services by category">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item} className={`min-h-10 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === item ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-card hover:bg-muted"}`}>{item}</button>)}</div></div>{visibleServices.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"><p className="font-medium">No services found</p><p className="mt-1 text-sm text-muted-foreground">Try changing your search or category.</p></div> : <div className="grid gap-4 md:grid-cols-2">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>}</div>;
}
