"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationEngineResponse, GovernmentServiceDetail, MockDigiLockerDocument } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Separator } from "@/components/ui/separator";

function displayName(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function ConsentPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    application: ApplicationEngineResponse;
    service: GovernmentServiceDetail;
  }>();
  const [documents, setDocuments] = useState<MockDigiLockerDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    api
      .getApplication(applicationId)
      .then(async (application) => {
        const [service, digilockerDocuments] = await Promise.all([
          api.getService(application.service_id),
          api.getDigiLockerDocuments(),
        ]);
        setData({ application, service });
        setDocuments(digilockerDocuments);

        // Auto-select single matching documents
        const matching = digilockerDocuments.filter((doc) =>
          service.document_requirements.some(
            (req) =>
              req.document_type === doc.document_type ||
              (req.document_type === "MARKSHEET" && doc.document_type.endsWith("_MARKSHEET")) ||
              (req.document_type === "IDENTITY_DOCUMENT" && doc.document_type === "DRIVING_LICENCE")
          )
        );
        if (matching.length === 1) {
          setSelectedDocumentIds([matching[0].id]);
        }
      })
      .catch(() => setError(true));
  }, [applicationId]);

  async function grantConsent() {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      if (selectedDocumentIds.length > 0) {
        await api.selectApplicationDocuments(applicationId, selectedDocumentIds);
      }
      await api.grantConsent(applicationId);
      router.push(`/applications/${applicationId}/preview`);
    } catch {
      setSubmitError("We could not record your consent. Please try again.");
      setSubmitting(false);
    }
  }

  if (error) {
    return (
      <ErrorState>
        This application could not be loaded. Return to the service catalog and try again.
      </ErrorState>
    );
  }

  if (!data) return <LoadingState label="Loading consent request…" />;

  const matchingDocuments = documents.filter((document) =>
    data.service.document_requirements.some(
      (requirement) =>
        requirement.document_type === document.document_type ||
        (requirement.document_type === "MARKSHEET" && document.document_type.endsWith("_MARKSHEET")) ||
        (requirement.document_type === "IDENTITY_DOCUMENT" &&
          document.document_type === "DRIVING_LICENCE")
    )
  );

  const profileFields = [
    ...data.service.required_profile_fields,
    ...data.service.fields.map((field) => field.key),
  ];

  return (
    <ApplicationFlowShell
      serviceName={data.service.name}
      step={2}
      stepName="Consent"
      onClose={() => router.push("/applications")}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="outline"
            onPress={() => router.push(`/applications/${applicationId}/additional`)}
          >
            Back
          </Button>
          <Button onPress={grantConsent} isDisabled={submitting}>
            {submitting ? "Recording consent…" : "Agree & Continue"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Consent</h1>

        {/* 1. Who receives */}
        <div className="space-y-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shared with
          </p>
          <p className="text-sm font-medium text-foreground">{data.service.department}</p>
        </div>

        <Separator />

        {/* 2. Profile Information */}
        <section className="space-y-2.5">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Profile</h3>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {profileFields.map((field) => (
              <li key={field} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>{displayName(field)}</span>
              </li>
            ))}
          </ul>
        </section>

        {data.service.document_requirements.length > 0 ? (
          <>
            <Separator />

            {/* 3. Documents */}
            <section className="space-y-2.5">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Documents</h3>
              <ul className="space-y-2">
                {data.service.document_requirements.map((document) => (
                  <li key={document.id} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>{document.label}</span>
                  </li>
                ))}
              </ul>

              {matchingDocuments.length > 1 ? (
                <div className="mt-3 rounded-lg border bg-muted/20 p-3 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Select documents
                  </p>
                  <div className="space-y-1.5">
                    {matchingDocuments.map((document) => (
                      <label
                        key={document.id}
                        className="flex items-center gap-2.5 rounded-md border bg-card p-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          isSelected={selectedDocumentIds.includes(document.id)}
                          onChange={(isSelected) =>
                            setSelectedDocumentIds((current) =>
                              isSelected
                                ? [...current, document.id]
                                : current.filter((id) => id !== document.id)
                            )
                          }
                        />
                        <span className="font-medium text-foreground">{document.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {submitError ? (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </div>
    </ApplicationFlowShell>
  );
}
