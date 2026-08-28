"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, CircleAlert, Download, Eye, FileBadge2, FileText, Landmark, Plus, Trash2, Upload, X } from "lucide-react";
import { api } from "@/src/lib/api";
import type { Document, DocumentCategory, MockDigiLockerDocument } from "@/src/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const supportedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const maximumFileSize = 5 * 1024 * 1024;

type DocumentsData = { documents: Document[]; digilocker: MockDigiLockerDocument[]; categories: DocumentCategory[] };
type ToastState = { message: string; tone: "success" | "error" };

function fileSize(size: number | null) {
  if (size === null) return null;
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKind(mimeType: string | null) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType?.startsWith("image/")) return "Image";
  return "File";
}

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : CircleAlert;
  return <div role={toast.tone === "error" ? "alert" : "status"} className="fixed right-4 top-4 z-[70] flex max-w-sm items-center gap-3 rounded-xl border bg-popover px-4 py-3 text-sm shadow-xl"><Icon className={`size-5 shrink-0 ${toast.tone === "success" ? "text-emerald-600" : "text-destructive"}`} aria-hidden="true" /><p className="font-medium">{toast.message}</p><Button type="button" variant="ghost" size="icon-sm" aria-label="Dismiss notification" onPress={onDismiss}><X aria-hidden="true" /></Button></div>;
}

export function DocumentsPage() {
  const [data, setData] = useState<DocumentsData>();
  const [error, setError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Document>();
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<ToastState>();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([api.getDocuments(), api.getDigiLockerDocuments(), api.getDocumentCategories()])
      .then(([documents, digilocker, categories]) => setData({ documents, digilocker, categories: categories.filter((item) => item.value !== "PROFILE_PHOTO") }))
      .catch(() => setError(true));
  }, []);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function resetUploadForm() {
    setCategory("");
    setDocumentName("");
    setFile(undefined);
    setPreviewUrl(undefined);
    setFormErrors({});
    if (fileInput.current) fileInput.current.value = "";
  }

  function openAddDialog() {
    resetUploadForm();
    setAddOpen(true);
  }

  function showToast(message: string, tone: ToastState["tone"]) {
    setToast({ message, tone });
  }

  function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    if (!supportedMimeTypes.includes(nextFile.type)) {
      setFormErrors((current) => ({ ...current, file: "Choose a PDF, JPG, JPEG, PNG or WEBP file." }));
      return;
    }
    if (nextFile.size > maximumFileSize) {
      setFormErrors((current) => ({ ...current, file: "Files must be 5 MB or smaller." }));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(nextFile.type.startsWith("image/") ? URL.createObjectURL(nextFile) : undefined);
    setFormErrors((current) => ({ ...current, file: "" }));
  }

  async function uploadDocument() {
    const errors: Record<string, string> = {};
    if (!category) errors.category = "Select a document category.";
    if (category === "OTHER" && !documentName.trim()) errors.documentName = "Enter a document name for Other.";
    if (!file) errors.file = "Choose a file to upload.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document_type", category);
      formData.append("file", file);
      if (category === "OTHER") formData.append("display_name", documentName.trim());
      const document = await api.uploadDocument(formData);
      setData((current) => current ? { ...current, documents: [...current.documents, document].sort((first, second) => first.name.localeCompare(second.name)) } : current);
      setAddOpen(false);
      resetUploadForm();
      showToast("Document added successfully.", "success");
    } catch (uploadError) {
      showToast(uploadError instanceof Error ? uploadError.message : "Could not add the document. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteDocument(pendingDelete.id);
      setData((current) => current ? { ...current, documents: current.documents.filter((document) => document.id !== pendingDelete.id) } : current);
      showToast("Document deleted.", "success");
      setPendingDelete(undefined);
    } catch (deleteError) {
      showToast(deleteError instanceof Error ? deleteError.message : "Could not delete the document. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const categoryLabel = (value: string) => data?.categories.find((item) => item.value === value)?.label ?? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());

  return (
    <div className="space-y-6">
      <PageHeader title="My documents" description="Upload and manage documents for future applications.">
        <Button onPress={openAddDialog} isDisabled={!data}><Plus aria-hidden="true" />Add Document</Button>
      </PageHeader>
      {error ? (
        <ErrorState>Documents are unavailable. Start the service API and try again.</ErrorState>
      ) : !data ? (
        <LoadingState label="Loading your documents…" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section>
            {data.documents.filter((document) => document.document_type !== "PROFILE_PHOTO").length === 0 ? (
              <EmptyState>
                <p className="font-medium text-foreground">No documents uploaded yet.</p>
                <p>Upload documents you frequently use in applications.</p>
                <Button className="mt-2" onPress={openAddDialog}><Plus aria-hidden="true" />Add Document</Button>
              </EmptyState>
            ) : (
              <Card className="border-t-4 border-t-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4 text-primary" aria-hidden="true" />
                My documents
              </CardTitle>
              <p className="text-sm text-muted-foreground">Documents you upload for reuse in applications.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                  {data.documents.filter((document) => document.document_type !== "PROFILE_PHOTO").map((document) => {
                    const sizeStr = fileSize(document.size_bytes);
                    return (
                      <li key={document.id} className="flex items-start justify-between gap-3 rounded-lg border border-primary/10 bg-blue-50/40 p-3">
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-medium">{document.display_name || document.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabel(document.document_type)} · {fileKind(document.mime_type)}{sizeStr ? ` · ${sizeStr}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <a
                            href={`${apiBaseUrl}/api/profile/documents/${document.id}/file`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`View ${document.display_name || document.name}`}
                          >
                            <Eye className="size-4" aria-hidden="true" />
                          </a>
                          <a
                            href={`${apiBaseUrl}/api/profile/documents/${document.id}/download`}
                            download
                            className="inline-flex size-8 items-center justify-center rounded-lg text-primary hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`Download ${document.display_name || document.name}`}
                          >
                            <Download className="size-4" aria-hidden="true" />
                          </a>
                          <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${document.display_name || document.name}`}
                              onPress={() => setPendingDelete(document)}
                            >
                              <Trash2 className="text-destructive" aria-hidden="true" />
                            </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
            </CardContent>
              </Card>
            )}
          </section>

          <Card className="border-t-4 border-t-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="size-4 text-emerald-600" aria-hidden="true" />
                DigiLocker
              </CardTitle>
              <p className="text-sm text-muted-foreground">Synthetic documents available through mock DigiLocker.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.digilocker.map((document) => (
                  <li key={document.id} className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <FileBadge2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{document.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{document.issuer}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={`${apiBaseUrl}/api/digilocker/documents/${document.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`View ${document.name}`}
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </a>
                      <a
                        href={`${apiBaseUrl}/api/digilocker/documents/${document.id}/download`}
                        download
                        className="inline-flex size-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Download ${document.name}`}
                      >
                        <Download className="size-4" aria-hidden="true" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog isOpen={addOpen} onOpenChange={(open) => { if (!open) { setAddOpen(false); resetUploadForm(); } }} className="w-[calc(100%-2rem)] max-w-lg">
        <DialogHeader><DialogTitle>Add Document</DialogTitle><DialogDescription>Upload a document to your reusable document collection.</DialogDescription></DialogHeader>
        <div className="space-y-5">
          <div><Label htmlFor="document-category">Document Category</Label><Select aria-label="Document category" selectedKey={category} onSelectionChange={(value) => { setCategory(String(value)); setFormErrors((current) => ({ ...current, category: "" })); }}><SelectTrigger id="document-category" className="mt-2" aria-invalid={Boolean(formErrors.category)}><SelectValue>{category ? categoryLabel(category) : "Select category"}</SelectValue></SelectTrigger><SelectContent>{data?.categories.map((item) => <SelectItem key={item.value} id={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>{formErrors.category ? <p className="mt-1 text-xs text-destructive" role="alert">{formErrors.category}</p> : null}</div>
          {category === "OTHER" ? <div><Label htmlFor="document-name">Document Name</Label><Input id="document-name" className="mt-2" value={documentName} onChange={(event) => { setDocumentName(event.target.value); setFormErrors((current) => ({ ...current, documentName: "" })); }} aria-invalid={Boolean(formErrors.documentName)} aria-describedby={formErrors.documentName ? "document-name-error" : undefined} placeholder="e.g. NCC Certificate" />{formErrors.documentName ? <p id="document-name-error" className="mt-1 text-xs text-destructive" role="alert">{formErrors.documentName}</p> : null}</div> : null}
          <div><Label>Upload File</Label><input ref={fileInput} className="sr-only" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0])} /><Button type="button" variant="outline" className="mt-2 h-32 w-full border-dashed" onPress={() => fileInput.current?.click()}><span className="flex flex-col items-center gap-2"><Upload aria-hidden="true" /><span>Click to choose a file</span><span className="text-xs font-normal text-muted-foreground">PDF, JPG, JPEG, PNG or WEBP · maximum 5 MB</span></span></Button>{formErrors.file ? <p className="mt-1 text-xs text-destructive" role="alert">{formErrors.file}</p> : null}</div>
          {file ? <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">{previewUrl ? <Image src={previewUrl} alt="Selected document preview" width={48} height={48} unoptimized className="size-12 rounded object-cover" /> : <FileText className="size-8 text-primary" aria-hidden="true" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.name}</p><p className="text-xs text-muted-foreground">{fileKind(file.type)} · {fileSize(file.size)}</p></div><Button type="button" variant="ghost" size="icon-sm" aria-label="Remove selected file" onPress={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setFile(undefined); setPreviewUrl(undefined); if (fileInput.current) fileInput.current.value = ""; }}><X aria-hidden="true" /></Button></div> : null}
        </div>
        <DialogFooter><DialogClose type="button">Cancel</DialogClose><Button type="button" isDisabled={uploading} onPress={uploadDocument}>{uploading ? "Uploading…" : "Add Document"}</Button></DialogFooter>
      </Dialog>

      <Dialog isOpen={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(undefined); }}><DialogHeader><DialogTitle>Delete document?</DialogTitle><DialogDescription>This will permanently remove {pendingDelete?.display_name || pendingDelete?.name} from your reusable documents.</DialogDescription></DialogHeader><DialogFooter><DialogClose type="button">Cancel</DialogClose><Button type="button" variant="destructive" isDisabled={!pendingDelete || deleting} onPress={deleteDocument}>{deleting ? "Deleting…" : "Delete"}</Button></DialogFooter></Dialog>
      {toast ? <Toast toast={toast} onDismiss={() => setToast(undefined)} /> : null}
    </div>
  );
}
