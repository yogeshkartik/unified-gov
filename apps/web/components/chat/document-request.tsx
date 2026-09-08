"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, Landmark, LoaderCircle } from "lucide-react";
import { ApiError, api } from "@/src/lib/api";
import type { ApplicationDocumentActionResponse, DocumentRequest } from "@/src/types";
import { Button } from "@/components/ui/button";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeDocumentType } from "@/src/i18n/service-localization";

const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const accept = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
const maximumBytes = 5 * 1024 * 1024;

type Props = {
  request: DocumentRequest;
  onAttached: (result: ApplicationDocumentActionResponse) => void;
};

export function DocumentRequestCard({ request, onAttached }: Props) {
  const { language, t } = useCitizenPreferences();
  const [busyId, setBusyId] = useState<string>();
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File>();
  const [error, setError] = useState<string>();
  const [complete, setComplete] = useState(false);
  const requirementLabel = localizeDocumentType(
    request.requirement.document_type,
    request.requirement.label,
    language,
  );

  function failureMessage(cause: unknown) {
    if (cause instanceof ApiError) {
      if (cause.detail?.code === "FILE_TOO_LARGE") return t("chatFileTooLarge");
      if (["UNSUPPORTED_FILE_TYPE", "EMPTY_FILE", "INVALID_FILE_CONTENT", "UNSUPPORTED_PHOTOGRAPH"].includes(cause.detail?.code ?? "")) return t("chatUnsupportedFile");
    }
    return t("chatDocumentActionFailed");
  }

  async function run(id: string, action: () => Promise<ApplicationDocumentActionResponse>) {
    if (busyId || complete) return;
    setBusyId(id);
    setError(undefined);
    try {
      const result = await action();
      setComplete(true);
      onAttached(result);
    } catch (cause) {
      setError(failureMessage(cause));
    } finally {
      setBusyId(undefined);
    }
  }

  function chooseFile(next?: File) {
    setError(undefined);
    if (!next) {
      setFile(undefined);
      return;
    }
    if (!acceptedTypes.has(next.type) || next.size === 0) {
      setFile(undefined);
      setError(t("chatUnsupportedFile"));
      return;
    }
    if (next.size > maximumBytes) {
      setFile(undefined);
      setError(t("chatFileTooLarge"));
      return;
    }
    setFile(next);
  }

  async function upload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("application_id", request.application_id);
    formData.append("requirement_id", request.requirement.id);
    formData.append("file", file);
    await run("upload", () => api.uploadChatApplicationDocument(formData));
  }

  if (complete) return null;

  return (
    <section className="mt-3 min-w-0 max-w-3xl rounded-xl border bg-card p-4 text-foreground" aria-labelledby={`document-${request.requirement.id}`}>
      <p id={`document-${request.requirement.id}`} className="font-semibold break-words">{t("chatDocumentRequired", { name: requirementLabel })}</p>
      {request.existing_documents.length > 0 ? <div className="mt-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("chatMyDocuments")}</p><div className="mt-2 flex min-w-0 flex-col gap-2">{request.existing_documents.map((document) => <Button key={document.document_id} type="button" variant="outline" className="h-auto min-w-0 justify-start whitespace-normal py-2 text-left" isDisabled={Boolean(busyId)} onPress={() => run(document.document_id, () => api.attachChatApplicationDocument(request.application_id, request.requirement.id, document.document_id))}>{busyId === document.document_id ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}<span className="min-w-0 break-words">{document.name}</span></Button>)}</div></div> : null}
      {request.digilocker_options.length > 0 ? <div className="mt-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("chatDigiLocker")}</p><div className="mt-2 flex min-w-0 flex-col gap-2">{request.digilocker_options.map((document) => <Button key={document.document_id} type="button" variant="outline" className="h-auto min-w-0 justify-start whitespace-normal py-2 text-left" isDisabled={Boolean(busyId)} onPress={() => run(document.document_id, () => api.importChatDigiLockerDocument(request.application_id, request.requirement.id, document.document_id))}>{busyId === document.document_id ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Landmark aria-hidden="true" />}<span className="min-w-0 break-words">{document.name}<span className="block text-xs font-normal text-muted-foreground">{document.issuer}</span></span></Button>)}</div></div> : null}
      {request.upload_allowed ? <div className="mt-3">{!showUpload ? <Button type="button" variant="outline" className="w-full justify-start" isDisabled={Boolean(busyId)} onPress={() => setShowUpload(true)}><FileUp aria-hidden="true" />{t("chatUploadDocument")}</Button> : <div className="space-y-2 rounded-md border p-3"><label className="block text-sm font-medium" htmlFor={`chat-upload-${request.requirement.id}`}>{t("chatChooseFile")}</label><input id={`chat-upload-${request.requirement.id}`} type="file" accept={accept} disabled={Boolean(busyId)} className="block w-full min-w-0 text-sm file:mr-2 file:rounded-md file:border file:bg-background file:px-2 file:py-1.5" onChange={(event) => chooseFile(event.currentTarget.files?.[0])} /><p className="text-xs text-muted-foreground">{t("chatFileFormats")}</p><Button type="button" size="sm" isDisabled={!file || Boolean(busyId)} onPress={upload}>{busyId === "upload" ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("chatUploading")}</> : t("chatUploadDocument")}</Button></div>}</div> : null}
      {request.existing_documents.length === 0 && request.digilocker_options.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">{t("chatNoCompatibleDocuments")}</p> : null}
      {error ? <p className="mt-2 text-sm text-destructive" role="alert">{error}</p> : null}
    </section>
  );
}
