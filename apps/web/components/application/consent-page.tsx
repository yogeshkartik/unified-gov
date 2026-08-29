"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Upload } from "lucide-react";
import { ApiError, api } from "@/src/lib/api";
import { notifyProfilePhotoChanged } from "@/src/lib/profile-photo";
import type { ApplicationEngineResponse, Document as CitizenDocument, GovernmentServiceDetail, MockDigiLockerDocument } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { applicationFlowSteps, navigateApplicationFlow } from "@/components/application/application-flow-navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { Separator } from "@/components/ui/separator";
import { DocumentFilePicker } from "@/components/documents/document-file-picker";

function displayName(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function matchesRequirement(requiredType: string, availableType: string) {
  const canonical = (type: string) => type === "PROFILE_PHOTO" ? "PHOTOGRAPH" : type;
  const required = canonical(requiredType);
  const available = canonical(availableType);
  return required === available ||
    (required === "MARKSHEET" && available.endsWith("_MARKSHEET")) ||
    (required === "IDENTITY_DOCUMENT" && available === "DRIVING_LICENCE");
}

export function ConsentPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<{
    application: ApplicationEngineResponse;
    service: GovernmentServiceDetail;
  }>();
  const [documents, setDocuments] = useState<MockDigiLockerDocument[]>([]);
  const [myDocuments, setMyDocuments] = useState<CitizenDocument[]>([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([]);
  const [selectedMyDocumentIds, setSelectedMyDocumentIds] = useState<string[]>([]);
  const [uploadRequirement, setUploadRequirement] = useState<{ document_type: string; label: string }>();
  const [uploadFile, setUploadFile] = useState<File>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    api
      .getApplication(applicationId)
      .then(async (application) => {
        const [service, digilockerDocuments, citizenDocuments] = await Promise.all([
          api.getService(application.service_id),
          api.getDigiLockerDocuments(),
          api.getDocuments(),
        ]);
        setData({ application, service });
        setDocuments(digilockerDocuments);
        setMyDocuments(citizenDocuments);
        const automaticMyDocuments: string[] = [];
        const automaticDigiLockerDocuments: string[] = [];
        for (const requirement of service.document_requirements) {
          const profile = citizenDocuments.filter((document) => document.document_type === "PHOTOGRAPH" && matchesRequirement(requirement.document_type, document.document_type));
          const personal = citizenDocuments.filter((document) => document.document_type !== "PHOTOGRAPH" && matchesRequirement(requirement.document_type, document.document_type));
          const provider = digilockerDocuments.filter((document) => matchesRequirement(requirement.document_type, document.document_type));
          if (profile.length === 0 && personal.length + provider.length === 1) {
            if (personal.length === 1) automaticMyDocuments.push(personal[0].id);
            if (provider.length === 1) automaticDigiLockerDocuments.push(provider[0].id);
          }
        }
        setSelectedMyDocumentIds(automaticMyDocuments);
        setSelectedDocumentIds(automaticDigiLockerDocuments);
      })
      .catch(() => setError(true));
  }, [applicationId]);

  async function grantConsent() {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      if (selectedMyDocumentIds.length > 0) {
        await api.selectMyDocuments(applicationId, selectedMyDocumentIds);
      }
      if (selectedDocumentIds.length > 0) {
        await api.selectApplicationDocuments(applicationId, selectedDocumentIds);
      }
      await api.grantConsent(applicationId);
      navigateApplicationFlow(router, applicationId, "preview", "forward");
    } catch (error) {
      if (error instanceof ApiError && error.detail?.code === "APPLICATION_INCOMPLETE") {
        const missing = [
          ...(error.detail.missing_profile_fields ?? []),
          ...(error.detail.missing_documents ?? []),
          ...(error.detail.missing_fields ?? []),
        ];
        setSubmitError(
          missing.length > 0
            ? `Complete or select: ${missing.map(displayName).join(", ")}.`
            : "Complete the missing information before continuing."
        );
      } else {
        setSubmitError("We could not record your consent. Please try again.");
      }
      setSubmitting(false);
    }
  }

  async function uploadRequiredDocument() {
    if (!uploadRequirement || !uploadFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document_type", uploadRequirement.document_type);
      formData.append("file", uploadFile);
      const document = await api.uploadDocument(formData);
      await api.selectMyDocuments(applicationId, [document.id]);
      setMyDocuments((current) => [...current, document]);
      setSelectedMyDocumentIds((current) => [...current, document.id]);
      if (document.document_type === "PHOTOGRAPH") notifyProfilePhotoChanged();
      setUploadRequirement(undefined);
      setUploadFile(undefined);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not upload the document.");
    } finally {
      setUploading(false);
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

  const profileFields = [
    ...data.service.required_profile_fields,
    ...data.service.fields.map((field) => field.key),
  ];

  return (
    <ApplicationFlowShell
      serviceName={data.service.name}
      applicationId={applicationId}
      step={applicationFlowSteps.consent.index}
      stepName={applicationFlowSteps.consent.label}
      onClose={() => router.push("/applications")}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
          <Button
            type="button"
            variant="outline"
            onPress={() => navigateApplicationFlow(router, applicationId, "additional", "back")}
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
              <ul className="space-y-3">
                {data.service.document_requirements.map((requirement) => {
                  const profileDocument = myDocuments.find((document) => document.document_type === "PHOTOGRAPH" && matchesRequirement(requirement.document_type, document.document_type));
                  const personal = myDocuments.filter((document) => document.document_type !== "PHOTOGRAPH" && matchesRequirement(requirement.document_type, document.document_type));
                  const provider = documents.filter((document) => matchesRequirement(requirement.document_type, document.document_type));
                  const hasSource = Boolean(profileDocument) || personal.length > 0 || provider.length > 0;
                  return <li key={requirement.id} className="rounded-lg border bg-muted/20 p-3">
                    <p className="font-medium text-sm">{requirement.label}</p>
                    {profileDocument ? <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700"><CheckCircle2 className="size-4" />My Profile</p> : null}
                    {personal.map((document) => <label key={document.id} className="mt-2 flex cursor-pointer items-center gap-2 text-sm"><Checkbox isSelected={selectedMyDocumentIds.includes(document.id)} onChange={(selected) => setSelectedMyDocumentIds((current) => selected ? [...current, document.id] : current.filter((id) => id !== document.id))} />My Documents — {document.display_name || document.name}</label>)}
                    {provider.map((document) => <label key={document.id} className="mt-2 flex cursor-pointer items-center gap-2 text-sm"><Checkbox isSelected={selectedDocumentIds.includes(document.id)} onChange={(selected) => setSelectedDocumentIds((current) => selected ? [...current, document.id] : current.filter((id) => id !== document.id))} />DigiLocker — {document.name}</label>)}
                    {!hasSource ? <div className="mt-2 flex items-center justify-between gap-3"><span className="text-xs text-destructive">Missing</span><Button type="button" size="sm" variant="outline" onPress={() => setUploadRequirement({ document_type: requirement.document_type, label: requirement.label })}><Upload aria-hidden="true" />Upload document</Button></div> : null}
                  </li>;
                })}
              </ul>
            </section>
          </>
        ) : null}

        {submitError ? (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </div>
      <Dialog isOpen={Boolean(uploadRequirement)} onOpenChange={(open) => { if (!open) { setUploadRequirement(undefined); setUploadFile(undefined); } }}>
        <DialogHeader><DialogTitle>Upload {uploadRequirement?.label}</DialogTitle><DialogDescription>This file will be saved to My Documents and used for this application.</DialogDescription></DialogHeader>
        <div className="space-y-4"><div><p className="text-sm font-medium">Document type</p><div className="mt-1 rounded-md border bg-muted/40 px-3 py-2 text-sm"><p>{uploadRequirement?.label}</p><p className="mt-0.5 text-xs text-muted-foreground">Required for this application</p></div></div><DocumentFilePicker id="required-document-file" file={uploadFile} onChange={setUploadFile} /></div>
        <DialogFooter><DialogClose type="button">Cancel</DialogClose><Button type="button" isDisabled={!uploadFile || uploading} onPress={uploadRequiredDocument}>{uploading ? "Uploading…" : "Upload"}</Button></DialogFooter>
      </Dialog>
    </ApplicationFlowShell>
  );
}
