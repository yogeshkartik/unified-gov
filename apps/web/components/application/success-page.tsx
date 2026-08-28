"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { api } from "@/src/lib/api";
import { saveApplication } from "@/src/lib/application-store";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

export function SuccessPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [preview, setPreview] = useState<ApplicationPreview>();
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getPreview(applicationId)
      .then((loadedPreview) => {
        setPreview(loadedPreview);
        const reference = searchParams.get("reference");
        if (reference) {
          saveApplication({
            id: applicationId,
            service_id: String(loadedPreview.service.id),
            service_name: String(loadedPreview.service.name),
            status: "SUBMITTED",
            fee: loadedPreview.fee,
            currency: loadedPreview.currency,
            created_at: new Date().toISOString(),
            government_reference_number: reference,
          });
        }
      })
      .catch(() => setError(true));
  }, [applicationId, searchParams]);

  if (error) {
    return (
      <ErrorState>
        Your application was submitted, but its summary could not be loaded.
      </ErrorState>
    );
  }

  if (!preview) return <LoadingState label="Loading submission confirmation…" />;

  const reference =
    searchParams.get("reference") ?? `GOV-DEMO-${applicationId.slice(0, 8).toUpperCase()}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback
    }
  }

  return (
    <ApplicationFlowShell
      serviceName={String(preview.service.name)}
      step={5}
      stepName="Submitted"
      onClose={() => router.push("/applications")}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="outline"
            onPress={() => router.push(`/applications/${applicationId}/preview`)}
          >
            View Application
          </Button>
          <Button onPress={() => router.push("/applications")}>Done</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center text-center py-4 sm:py-6 space-y-5">
        {/* Animated Checkmark Circle */}
        <div className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in-75 fade-in-0 duration-300 motion-reduce:animate-none shadow-sm">
          <Check className="size-8 stroke-[3]" aria-hidden="true" />
        </div>

        {/* Title and Service */}
        <div className="space-y-1 animate-in fade-in-0 duration-400 delay-100 motion-reduce:animate-none">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Application submitted
          </h1>
          <p className="text-sm font-medium text-muted-foreground">{String(preview.service.name)}</p>
        </div>

        {/* Compact Reference Card */}
        <div className="w-full max-w-sm rounded-lg border bg-muted/20 p-4 space-y-1.5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-200 motion-reduce:animate-none">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reference number
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-base sm:text-lg font-bold tracking-wide text-foreground break-all">
              {reference}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onPress={handleCopy}
              aria-label="Copy reference number"
            >
              {copied ? (
                <Check className="size-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
          {copied ? <p className="text-xs text-emerald-600 font-medium">Copied to clipboard</p> : null}
        </div>

        {/* Prototype Notice */}
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed animate-in fade-in-0 duration-400 delay-300 motion-reduce:animate-none">
          This is a prototype submission and was not sent to a live government system.
        </p>
      </div>
    </ApplicationFlowShell>
  );
}
