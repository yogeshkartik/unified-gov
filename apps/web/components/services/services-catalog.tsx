"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, BookOpen, Check, ClipboardList, FileCheck, Landmark, LayoutGrid, Search } from "lucide-react";
import { api } from "@/src/lib/api";
import type { GovernmentService } from "@/src/types";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/services/service-card";

export function ServicesCatalog() {
  const [services, setServices] = useState<GovernmentService[]>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { api.getServices().then(setServices).catch(() => setError(true)); }, []);
  const categories = useMemo(() => Array.from(new Set((services ?? []).map((service) => service.category))).map((name) => ({ name, count: services?.filter((service) => service.category === name).length ?? 0 })), [services]);
  const visibleServices = useMemo(() => (services ?? []).filter((service) => (category === null || service.category === category) && `${service.name} ${service.department} ${service.category} ${service.description}`.toLowerCase().includes(query.toLowerCase())), [category, query, services]);
  if (error) return <ErrorState>The service catalog is unavailable. Start the service API and refresh.</ErrorState>;
  if (!services) return <LoadingState label="Loading available services…" />;
  const categoryCards = [{ name: null, label: "All Services", count: services.length }, ...categories.map((item) => ({ ...item, label: item.name }))];
  const selectedLabel = category ?? "All Services";

  return <div className="space-y-6"><label className="relative block max-w-lg"><span className="sr-only">Search services</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services" className="min-h-11 pl-9" /></label><section aria-labelledby="browse-by-category"><h2 id="browse-by-category" className="text-sm font-medium">Browse by category</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{categoryCards.map((item) => { const Icon = categoryIcon(item.name); const selected = category === item.name; return <button key={item.label} type="button" onClick={() => setCategory(item.name)} aria-pressed={selected} className={`relative flex min-h-24 items-start gap-3 rounded-xl border bg-card p-4 text-left transition-[border-color,box-shadow,background-color] duration-200 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary/40 bg-primary/5 shadow-sm" : "border-border hover:border-primary/25 hover:shadow-sm"}`}><Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><span><span className="block font-medium">{item.label}</span><span className="mt-1 block text-sm text-muted-foreground">{item.count} {item.count === 1 ? "service" : "services"}</span></span>{selected ? <Check className="absolute right-4 top-4 size-4 text-primary" aria-hidden="true" /> : null}</button>})}</div></section><section aria-labelledby="services-heading"><div className="mb-3 flex items-baseline justify-between gap-3"><h2 id="services-heading" className="text-lg font-medium">{selectedLabel}</h2><p className="text-sm text-muted-foreground">{visibleServices.length} {visibleServices.length === 1 ? "service" : "services"}</p></div>{visibleServices.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center"><p className="font-medium">{category ? "No services found in this category." : "No services found"}</p><p className="mt-1 text-sm text-muted-foreground">Try changing your search or category.</p></div> : <div className="space-y-3">{visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}</div>}</section></div>;
}

function categoryIcon(category: string | null) {
  if (category === null) return LayoutGrid;
  if (category === "Government Schemes") return Landmark;
  if (category === "Examinations") return ClipboardList;
  if (category === "Certificates") return FileCheck;
  if (category === "Identity & Licences") return BadgeCheck;
  if (category === "Education & Scholarships") return BookOpen;
  return LayoutGrid;
}
