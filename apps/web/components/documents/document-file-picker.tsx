"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FileText, ImageUp, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { cn } from "@/lib/utils";

const accept = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";
const acceptedExtensions = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);
const maxBytes = 5 * 1024 * 1024;

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAccepted(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return Boolean(extension && acceptedExtensions.has(extension));
}

export function DocumentFilePicker({ file, onChange, id = "document-file" }: { file?: File; onChange: (file?: File) => void; id?: string }) {
  const { t } = useCitizenPreferences();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>();
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const previewRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    return () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); };
  }, []);

  function updatePreview(nextFile?: File) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const nextPreview = nextFile?.type.startsWith("image/") ? URL.createObjectURL(nextFile) : undefined;
    previewRef.current = nextPreview;
    setPreviewUrl(nextPreview);
  }

  function choose(nextFile?: File) {
    setDragActive(false);
    if (!nextFile) return;
    if (!isAccepted(nextFile)) {
      setError(t("unsupportedFile"));
      updatePreview();
      onChange(undefined);
      return;
    }
    if (nextFile.size > maxBytes) {
      setError(t("fileTooLarge"));
      updatePreview();
      onChange(undefined);
      return;
    }
    setError(undefined);
    updatePreview(nextFile);
    onChange(nextFile);
  }

  if (file) {
    return (
      <div className="flex min-h-24 w-full max-w-full min-w-0 flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
        {previewUrl ? <Image src={previewUrl} alt={t("chooseFileToUpload")} width={56} height={56} unoptimized className="size-14 shrink-0 rounded-md object-cover" /> : <FileText className="size-9 shrink-0 text-primary" aria-hidden="true" />}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate font-medium">{file.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatSize(file.size)}</p>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-1 sm:w-auto">
          <Button type="button" variant="outline" size="sm" onPress={() => inputRef.current?.click()}>{t("change")}</Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t("removeSelectedFile")} onPress={() => { updatePreview(); onChange(undefined); if (inputRef.current) inputRef.current.value = ""; }}><X aria-hidden="true" /></Button>
        </div>
        <input ref={inputRef} id={id} className="sr-only" type="file" accept={accept} aria-label={t("chooseFileToUpload")} onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => choose(event.target.files?.[0])} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0">
      <input ref={inputRef} id={id} className="sr-only" type="file" accept={accept} aria-label={t("chooseFileToUpload")} onChange={(event) => choose(event.target.files?.[0])} />
      <button type="button" className={cn("flex min-h-44 w-full flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", dragActive ? "border-primary bg-primary/10" : error ? "border-destructive bg-destructive/5" : "border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10")} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(event) => { event.preventDefault(); choose(event.dataTransfer.files?.[0]); }}>
        <ImageUp className="size-7 text-primary" aria-hidden="true" />
        <span className="mt-3 font-medium">{dragActive ? t("dropFile") : t("chooseFileToUpload")}</span>
        <span className="mt-2 inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-primary"><Upload className="size-4" aria-hidden="true" />{t("chooseFile")}</span>
        <span className="mt-3 text-xs text-muted-foreground">{t("fileFormats")}</span>
      </button>
      {error ? <p className="mt-2 text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}
