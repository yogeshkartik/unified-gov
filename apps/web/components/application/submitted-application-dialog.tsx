"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, Copy, Landmark } from "lucide-react";
import type { ApplicationListItem } from "@/components/application/applications-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

function formatFieldLabel(key: string): string {
  return key
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function SubmittedApplicationDialog({
  application,
  isOpen,
  onOpenChange,
}: {
  application?: ApplicationListItem | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!application) return null;

  const referenceNumber =
    application.government_reference_number ||
    `GOV-${application.id.slice(0, 8).toUpperCase()}`;

  const answers = application.engine?.answers || {};
  const hasAnswers = Object.keys(answers).length > 0;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback
    }
  }

  function handleViewFull() {
    if (!application) return;
    onOpenChange(false);
    router.push(`/applications/${application.id}/preview`);
  }

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      overlayClassName="bg-black/50 backdrop-blur-sm"
      className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8"
    >
      <DialogHeader className="gap-1.5 pr-8">
        <DialogTitle className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          {application.service_name}
        </DialogTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium">
            <Landmark className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {application.department}
          </span>
          <span className="text-muted-foreground/60">•</span>
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-800 font-medium"
          >
            Submitted
          </Badge>
        </div>
      </DialogHeader>

      <div className="mt-4 rounded-lg border bg-muted/20 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Reference number
        </p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="font-mono text-base sm:text-lg font-semibold tracking-wide text-foreground break-all">
            {referenceNumber}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs shrink-0"
            onPress={handleCopy}
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-600" aria-hidden="true" />
                <span className="text-emerald-700 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <Separator className="my-6" />

      <section>
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Application information
        </h3>
        {hasAnswers ? (
          <dl className="mt-3.5 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-2">
            {Object.entries(answers).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatFieldLabel(key)}
                </dt>
                <dd className="text-sm font-medium text-foreground break-words">
                  {formatFieldValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No additional service-specific information was required for this application.
          </p>
        )}
      </section>

      <Separator className="my-6" />

      <section>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Submission
            </p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Submitted successfully</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment
            </p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{application.fee > 0 ? "Completed" : "Not required"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Consent
            </p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Granted</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <DialogClose variant="outline" className="w-full sm:w-auto">
          Close
        </DialogClose>
        <Button
          type="button"
          className="w-full sm:w-auto gap-2"
          onPress={handleViewFull}
        >
          <span>View Full Application</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </Dialog>
  );
}
