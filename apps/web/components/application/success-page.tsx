"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationDetail, ApplicationPreview } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

export function SuccessPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<ApplicationPreview>();
  const [application, setApplication] = useState<ApplicationDetail>();
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([api.getPreview(applicationId), api.getApplication(applicationId)])
      .then(([loadedPreview, loadedApplication]) => {
        setPreview(loadedPreview);
        setApplication(loadedApplication);
      })
      .catch(() => setError(true));
  }, [applicationId]);

  if (error) {
    return (
      <ErrorState>
        Your application was submitted, but its summary could not be loaded.
      </ErrorState>
    );
  }

  if (!preview || !application) return <LoadingState label="Loading submission confirmation…" />;

  const reference = application.reference_number;

  async function handleCopy() {
    try {
      if (!reference) return;
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
      <div className="flex flex-col items-center text-center py-4 sm:py-6 space-y-4">
        {/* Animated Checkmark Circle */}
        <div className="grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 animate-in zoom-in-75 fade-in-0 duration-300 motion-reduce:animate-none shadow-sm">
          <Check className="size-7 stroke-[3]" aria-hidden="true" />
        </div>

        {/* Title and Service */}
        <div className="space-y-0.5 animate-in fade-in-0 duration-400 delay-100 motion-reduce:animate-none">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Application submitted
          </h1>
          <p className="text-sm text-muted-foreground">{String(preview.service.name)}</p>
        </div>

        {/* Compact Reference Card */}
        <div className="w-full max-w-xs rounded-lg border bg-muted/20 p-3.5 space-y-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-200 motion-reduce:animate-none">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reference
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-base font-bold tracking-wide text-foreground break-all">
              {reference ?? "Not available"}
            </span>
            {reference ? <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onPress={handleCopy}
              aria-label="Copy reference number"
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5 text-muted-foreground" />
              )}
            </Button> : null}
          </div>
          {copied ? <p className="text-xs text-emerald-600 font-medium">Copied to clipboard</p> : null}
        </div>

        {/* Prototype Notice */}
        <p className="text-xs text-muted-foreground animate-in fade-in-0 duration-400 delay-300 motion-reduce:animate-none">
          Prototype submission only.
        </p>
      </div>
    </ApplicationFlowShell>
  );
}
