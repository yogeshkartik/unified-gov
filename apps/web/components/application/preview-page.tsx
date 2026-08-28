"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/src/lib/api";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { applicationFlowSteps, navigateApplicationFlow } from "@/components/application/application-flow-navigation";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Separator } from "@/components/ui/separator";

function formatKey(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

function formatAddress(address: unknown) {
  if (!address || typeof address !== "object") return null;
  const a = address as Record<string, unknown>;
  const parts = [
    a.line1,
    a.line2,
    a.city,
    a.district && a.district !== a.city ? a.district : null,
    a.state,
  ].filter(Boolean);
  const pincode = a.pincode ? `— ${a.pincode}` : "";
  return `${parts.join(", ")} ${pincode}`.trim();
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
      navigateApplicationFlow(router, applicationId, "payment", "forward");
    } catch {
      setFinalizeError(
        "This application is not ready to finalize. Check your entries and try again."
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

  if (!preview) return <LoadingState label="Preparing application preview…" />;

  const profile = preview.profile;
  const addresses = Array.isArray(profile.addresses) ? profile.addresses : [];
  const primaryAddress = addresses[0];
  const isSubmitted = preview.status === "SUBMITTED";

  const genderNationality = [profile.gender, profile.nationality]
    .filter(Boolean)
    .map(String)
    .join(" · ");

  const hasAnswers = Object.keys(preview.answers).length > 0;

  return (
    <ApplicationFlowShell
      serviceName={String(preview.service.name)}
      applicationId={applicationId}
      step={applicationFlowSteps.preview.index}
      stepName={applicationFlowSteps.preview.label}
      onClose={() => router.push("/applications")}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
          {!isSubmitted ? (
            <>
              <Button
                type="button"
                variant="outline"
                onPress={() => navigateApplicationFlow(router, applicationId, "consent", "back")}
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
      <div className="space-y-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {isSubmitted ? "Application preview" : "Review application"}
        </h1>

        {/* Personal Info Summary */}
        <section className="space-y-1.5 text-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Personal
          </h3>
          <p className="font-semibold text-foreground text-base">{String(profile.full_name ?? "Citizen")}</p>
          {profile.date_of_birth ? (
            <p className="text-muted-foreground">{formatDate(profile.date_of_birth)}</p>
          ) : null}
          {genderNationality ? <p className="text-muted-foreground">{genderNationality}</p> : null}
          {profile.email ? <p className="text-muted-foreground">{String(profile.email)}</p> : null}
          {primaryAddress ? (
            <p className="text-muted-foreground pt-0.5">{formatAddress(primaryAddress)}</p>
          ) : null}
        </section>

        {hasAnswers ? (
          <>
            <Separator />

            {/* Application Specific Answers */}
            <section className="space-y-3 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Application
              </h3>
              <dl className="grid grid-cols-1 gap-y-3 gap-x-6 sm:grid-cols-2">
                {Object.entries(preview.answers).map(([key, value]) => (
                  <div key={key} className="space-y-0.5">
                    <dt className="text-xs text-muted-foreground">{formatKey(key)}</dt>
                    <dd className="font-medium text-foreground">{String(value ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        ) : null}

        {preview.documents.length > 0 ? (
          <>
            <Separator />

            {/* Selected Documents */}
            <section className="space-y-2.5 text-sm">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documents
              </h3>
              <ul className="space-y-2">
                {preview.documents.map((document, index) => (
                  <li
                    key={String(document.id ?? index)}
                    className="flex items-center justify-between gap-3 font-medium text-foreground"
                  >
                    <span>{String(document.name)}</span>
                    <span className="text-xs text-muted-foreground">
                      {String(document.source) === "DIGILOCKER" ? "DigiLocker" : "My Documents"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        <Separator />

        {/* Fee */}
        <section className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">Fee</span>
          <span className="font-semibold text-foreground">
            {preview.fee > 0 ? `${preview.currency} ${preview.fee}` : "Free"}
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
