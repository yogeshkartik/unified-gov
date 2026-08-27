"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, UserRound } from "lucide-react";
import { api } from "@/src/lib/api";
import type { CitizenProfile, Document, GovernmentService } from "@/src/types";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceCard } from "@/components/services/service-card";

export function DashboardContent() {
  const [data, setData] = useState<{ profile: CitizenProfile; services: GovernmentService[]; documents: Document[] }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([api.getProfile(), api.getServices(), api.getDocuments()])
      .then(([profile, services, documents]) => setData({ profile, services, documents }))
      .catch(() => setError(true));
  }, []);

  if (error) return <ErrorState>The dashboard could not reach the service API. Start the FastAPI service and refresh.</ErrorState>;
  if (!data) return <LoadingState label="Loading your dashboard…" />;
  const firstName = data.profile.full_name.split(" ")[0] || "Citizen";
  const completion = data.profile.addresses.length > 0 && data.documents.length > 0 ? 92 : 70;
  return <div className="space-y-8"><section className="rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-7 text-primary-foreground shadow-md"><p className="text-sm font-medium text-blue-100">Citizen dashboard</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1><p className="mt-2 max-w-2xl text-blue-100">Access government services using your reusable citizen profile.</p></section><div className="grid gap-4 lg:grid-cols-3"><Card className="border-t-4 border-t-emerald-500 bg-gradient-to-br from-emerald-50/80 to-card lg:col-span-1"><CardHeader><CardTitle>Profile complete</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold text-emerald-700">{completion}%</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${completion}%` }} /></div><ul className="mt-5 space-y-2 text-sm"><li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />Personal details</li><li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />Address</li><li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />Education</li><li className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />{data.documents.length} documents available</li></ul></CardContent></Card><Card className="border-t-4 border-t-primary bg-gradient-to-br from-blue-50/80 to-card lg:col-span-2"><CardHeader><CardTitle>Reusable citizen profile</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2"><div className="flex gap-3"><UserRound className="mt-0.5 size-5 text-primary" aria-hidden="true" /><div><p className="font-medium">Use your details once</p><p className="mt-1 text-sm text-muted-foreground">Your profile, education and documents are reused only with your consent.</p></div></div><div><p className="font-medium">Explore available services</p><p className="mt-1 text-sm text-muted-foreground">Requirements come directly from the service catalog.</p></div></CardContent></Card></div><section><div className="mb-4"><h2 className="text-xl font-semibold">Available services</h2><p className="mt-1 text-sm text-muted-foreground">Explore services available through participating departments.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.services.map((service) => <ServiceCard key={service.id} service={service} />)}</div></section></div>;
}
