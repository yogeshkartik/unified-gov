"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, GraduationCap, IndianRupee, MapPin, UserRound } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationProgress } from "@/components/application/application-progress";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

function displayName(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function text(value: unknown) {
  return value === null || value === undefined || value === "" ? "Not provided" : String(value);
}

function SourceBadge({ children }: { children: string }) {
  return <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{children}</span>;
}

export function PreviewPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<ApplicationPreview>();
  const [error, setError] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string>();

  useEffect(() => {
    api.getPreview(applicationId).then(setPreview).catch(() => setError(true));
  }, [applicationId]);

  async function confirm() {
    setFinalizing(true);
    setFinalizeError(undefined);
    try {
      await api.finalizeApplication(applicationId);
      router.push(`/applications/${applicationId}/payment`);
    } catch {
      setFinalizeError("This application is not ready to finalize. Check its required profile information and additional fields.");
      setFinalizing(false);
    }
  }

  if (error) return <ErrorState>We could not load the application preview. Confirm consent and try again.</ErrorState>;
  if (!preview) return <LoadingState label="Preparing your complete application preview…" />;

  const profile = preview.profile;
  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ApplicationProgress currentStep={3} />
      <div>
        <p className="text-sm font-medium text-primary">Final review</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Review your application</h1>
        <p className="mt-2 leading-6 text-muted-foreground">Confirm the information below before continuing to payment and submission.</p>
      </div>

      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>{text(preview.service.name)}</CardTitle>
          <p className="text-sm text-muted-foreground">{text(preview.service.department)} · {text(preview.service.category)}</p>
        </CardHeader>
        <CardContent><p className="text-sm leading-6 text-muted-foreground">{text(preview.service.description)}</p></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-primary" aria-hidden="true" />Personal information</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            {["full_name", "date_of_birth", "gender", "nationality", "email", "category"].map((key) => (
              <div key={key}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{displayName(key)}</dt><dd className="mt-1 flex items-center justify-between gap-2 text-sm">{text(profile[key])}<SourceBadge>Profile</SourceBadge></dd></div>
            ))}
          </dl>
          {addresses.length > 0 ? <div className="mt-6 border-t border-border pt-4"><p className="flex items-center gap-2 text-sm font-medium"><MapPin className="size-4 text-primary" aria-hidden="true" />Address</p>{addresses.map((address, index) => { const item = address as Record<string, unknown>; return <p key={index} className="mt-2 text-sm leading-6 text-muted-foreground">{text(item.line1)}, {text(item.city)}, {text(item.state)} — {text(item.pincode)} <SourceBadge>Profile</SourceBadge></p>; })}</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="size-4 text-emerald-600" aria-hidden="true" />Education</CardTitle></CardHeader>
        <CardContent>{preview.education.length === 0 ? <p className="text-sm text-muted-foreground">No education record included.</p> : <ul className="space-y-3">{preview.education.map((education, index) => <li key={index} className="flex items-start justify-between gap-3 text-sm"><span>{text(education.level)} · {text(education.institution)} · {text(education.year)}</span><SourceBadge>Profile</SourceBadge></li>)}</ul>}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />Selected documents</CardTitle></CardHeader>
        <CardContent>{preview.documents.length === 0 ? <p className="text-sm text-muted-foreground">No application documents were selected for this draft.</p> : <ul className="space-y-3">{preview.documents.map((document, index) => <li key={String(document.id ?? index)} className="flex items-start justify-between gap-3 text-sm"><span>{text(document.name)}</span><SourceBadge>{text(document.source) === "DIGILOCKER" ? "DigiLocker" : "Profile"}</SourceBadge></li>)}</ul>}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Additional information</CardTitle></CardHeader>
        <CardContent>{Object.keys(preview.answers).length === 0 ? <p className="text-sm text-muted-foreground">No additional information was required.</p> : <dl className="grid gap-4 sm:grid-cols-2">{Object.entries(preview.answers).map(([key, value]) => <div key={key}><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{displayName(key)}</dt><dd className="mt-1 flex items-center justify-between gap-2 text-sm">{text(value)}<SourceBadge>Application</SourceBadge></dd></div>)}</dl>}</CardContent>
      </Card>

      <Card className="border-t-4 border-t-amber-500">
        <CardHeader><CardTitle className="flex items-center gap-2"><IndianRupee className="size-4 text-primary" aria-hidden="true" />Application fee</CardTitle></CardHeader>
        <CardContent><p className="text-lg font-semibold">{preview.fee > 0 ? `${preview.currency} ${preview.fee}` : "Free service"}</p></CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row"><LinkButton href={`/applications/${applicationId}/consent`} variant="outline" size="lg">Back</LinkButton><Button size="lg" onPress={confirm} isDisabled={finalizing}>{finalizing ? "Creating snapshot…" : "Confirm & continue"}</Button></div>
      {finalizeError ? <p role="alert" className="text-sm text-destructive">{finalizeError}</p> : null}
    </div>
  );
}
