"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Separator } from "@/components/ui/separator";

function displayName(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function text(value: unknown) {
  return value === null || value === undefined || value === "" ? "Not provided" : String(value);
}

function SourceBadge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 font-medium">
      {children}
    </span>
  );
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
      setFinalizeError(
        "This application is not ready to finalize. Check its required profile information and additional fields."
      );
      setFinalizing(false);
    }
  }

  if (error) {
    return (
      <ErrorState>
        We could not load the application preview. Confirm consent and try again.
      </ErrorState>
    );
  }

  if (!preview) return <LoadingState label="Preparing your complete application preview…" />;

  const profile = preview.profile;
  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];
  const isSubmitted = preview.status === "SUBMITTED";

  return (
    <ApplicationFlowShell
      serviceName={String(preview.service.name)}
      step={3}
      stepName="Preview"
      onClose={() => router.push("/applications")}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
          {!isSubmitted ? (
            <>
              <Button
                type="button"
                variant="outline"
                onPress={() => router.push(`/applications/${applicationId}/consent`)}
              >
                Back
              </Button>
              <Button onPress={confirm} isDisabled={finalizing}>
                {finalizing ? "Creating snapshot…" : "Confirm & Continue"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="ml-auto"
              onPress={() => router.push("/applications")}
            >
              Close
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {isSubmitted ? "Application preview" : "Review application"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSubmitted
              ? "This submitted application is read-only."
              : "Confirm the information below before continuing."}
          </p>
        </div>

        {/* Personal Details */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Personal information
          </h3>
          <dl className="grid grid-cols-1 gap-y-3 gap-x-6 sm:grid-cols-2">
            {["full_name", "date_of_birth", "gender", "nationality", "email", "category"].map(
              (key) => (
                <div key={key} className="space-y-0.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {displayName(key)}
                  </dt>
                  <dd className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
                    <span>{text(profile[key])}</span>
                    <SourceBadge>Profile</SourceBadge>
                  </dd>
                </div>
              )
            )}
          </dl>
          {addresses.length > 0 ? (
            <div className="mt-3 border-t border-border pt-3 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Address
              </p>
              {addresses.map((address, index) => {
                const item = address as Record<string, unknown>;
                return (
                  <p key={index} className="text-sm text-foreground">
                    {text(item.line1)}, {text(item.city)}, {text(item.state)} — {text(item.pincode)}
                  </p>
                );
              })}
            </div>
          ) : null}
        </section>

        <Separator />

        {/* Application Specific Answers */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Application details
          </h3>
          {Object.keys(preview.answers).length === 0 ? (
            <p className="text-sm text-muted-foreground">No additional information was required.</p>
          ) : (
            <dl className="grid grid-cols-1 gap-y-3 gap-x-6 sm:grid-cols-2">
              {Object.entries(preview.answers).map(([key, value]) => (
                <div key={key} className="space-y-0.5">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {displayName(key)}
                  </dt>
                  <dd className="flex items-center justify-between gap-2 text-sm font-medium text-foreground">
                    <span>{text(value)}</span>
                    <SourceBadge>Application</SourceBadge>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <Separator />

        {/* Documents */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Selected documents
          </h3>
          {preview.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No application documents attached.</p>
          ) : (
            <ul className="space-y-2">
              {preview.documents.map((document, index) => (
                <li
                  key={String(document.id ?? index)}
                  className="flex items-center justify-between gap-3 text-sm text-foreground"
                >
                  <span className="font-medium">{text(document.name)}</span>
                  <SourceBadge>
                    {text(document.source) === "DIGILOCKER" ? "DigiLocker" : "Profile"}
                  </SourceBadge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        {/* Fee */}
        <section className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Application fee</span>
          <span className="font-semibold text-foreground">
            {preview.fee > 0 ? `${preview.currency} ${preview.fee}` : "Free service"}
          </span>
        </section>

        {finalizeError ? (
          <p role="alert" className="text-sm text-destructive">
            {finalizeError}
          </p>
        ) : null}
      </div>
    </ApplicationFlowShell>
  );
}
