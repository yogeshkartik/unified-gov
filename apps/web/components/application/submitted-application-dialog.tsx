"use client";

import { useState } from "react";
import { Check, CheckCircle2, CircleAlert, Copy, Download, Landmark } from "lucide-react";
import type { ApplicationDetail } from "@/src/types";
import { api } from "@/src/lib/api";
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

function statusLabel(status: string): string {
  return status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function SummaryIcon({ successful }: { successful: boolean }) {
  return successful ? (
    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
  ) : (
    <CircleAlert className="size-4 text-amber-600 shrink-0" aria-hidden="true" />
  );
}

export function SubmittedApplicationDialog({
  application,
  isOpen,
  onOpenChange,
}: {
  application?: ApplicationDetail | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string>();

  if (!application) return null;

  const applicationId = application.id;
  const referenceNumber = application.reference_number;
  const canDownload = Boolean(referenceNumber) && ["SUBMITTED", "PROCESSING", "COMPLETED"].includes(application.status);

  const answers = application.answers;
  const hasAnswers = Object.keys(answers).length > 0;

  async function handleCopy() {
    try {
      if (!referenceNumber) return;
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback
    }
  }

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(undefined);
    try {
      const { blob, filename } = await api.downloadApplicationPdf(applicationId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Could not download application PDF.");
    } finally {
      setDownloading(false);
    }
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
            className={application.status === "REJECTED" || application.status === "CANCELLED"
              ? "border-destructive/30 bg-destructive/5 text-destructive font-medium"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 font-medium"}
          >
            {statusLabel(application.status)}
          </Badge>
        </div>
      </DialogHeader>

      {referenceNumber ? <div className="mt-4 rounded-lg border bg-muted/20 p-4">
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
      </div> : null}

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
              <SummaryIcon successful={Boolean(application.submission_status && application.submission_status !== "REJECTED" && application.submission_status !== "CANCELLED")} />
              <span>{application.submission_status ? statusLabel(application.submission_status) : "Not submitted"}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Payment
            </p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <SummaryIcon successful={application.payment_status === "COMPLETED" || application.payment_status === "NOT_REQUIRED"} />
              <span>{statusLabel(application.payment_status)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Consent
            </p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <SummaryIcon successful={application.consent_status === "GRANTED"} />
              <span>{application.consent_status ? statusLabel(application.consent_status) : "Not granted"}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <DialogClose variant="outline" className="w-full sm:w-auto">
          Close
        </DialogClose>
        {canDownload ? <Button
          type="button"
          className="w-full sm:w-auto gap-2"
          onPress={handleDownload}
          isDisabled={downloading}
          aria-live="polite"
        >
          <span>{downloading ? "Preparing PDF…" : "Download Application PDF"}</span>
          <Download className="size-4" aria-hidden="true" />
        </Button> : null}
      </div>
      {downloadError ? <p role="alert" className="mt-3 text-sm text-destructive">{downloadError}</p> : null}
    </Dialog>
  );
}
