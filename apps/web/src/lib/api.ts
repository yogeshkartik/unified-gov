import type {
  Address,
  ApplicationDetail,
  ApplicationEngineResponse,
  ApplicationSummary,
  ApplicationPreview,
  CitizenProfile,
  Consent,
  DocumentCategory,
  Document,
  Education,
  GovernmentService,
  GovernmentServiceDetail,
  PaymentResult,
  MockDigiLockerDocument,
  SubmissionResult,
} from "@/src/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ApiErrorDetail = {
  code?: string;
  message?: string;
  missing_profile_fields?: string[];
  missing_documents?: string[];
  missing_fields?: string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: ApiErrorDetail,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...init?.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "The service is temporarily unavailable.";
    let errorDetail: ApiErrorDetail | undefined;
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null && "detail" in body) {
        const detail = body.detail;
        if (typeof detail === "string") {
          message = detail;
        } else if (typeof detail === "object" && detail !== null) {
          errorDetail = detail as ApiErrorDetail;
          if ("message" in detail && typeof detail.message === "string") {
            message = detail.message;
          } else if ("fields" in detail && typeof detail.fields === "object" && detail.fields !== null) {
            const fieldMessages = Object.values(detail.fields).filter((value): value is string => typeof value === "string");
            if (fieldMessages.length > 0) message = fieldMessages.join(" ");
          }
        }
      }
    } catch {
      // Keep the safe fallback message when an error response is not JSON.
    }
    throw new ApiError(message, response.status, errorDetail);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function download(path: string): Promise<{ blob: Blob; filename: string }> {
  const response = await fetch(`${apiBaseUrl}${path}`, { headers: { Accept: "application/pdf" }, cache: "no-store" });
  if (!response.ok) {
    let message = "Could not download application PDF.";
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null && "detail" in body && typeof body.detail === "object" && body.detail !== null && "message" in body.detail && typeof body.detail.message === "string") message = body.detail.message;
    } catch {
      // Preserve the download-specific fallback.
    }
    throw new ApiError(message, response.status);
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "application.pdf";
  return { blob: await response.blob(), filename };
}

export const api = {
  getProfile: () => request<CitizenProfile>("/api/profile"),
  updateProfile: (profile: Omit<Partial<CitizenProfile>, "addresses"> & { addresses?: Array<Omit<Address, "id">> }) => request<CitizenProfile>("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }),
  uploadProfilePhoto: (data: FormData) => request<Document>("/api/profile/photo", { method: "PUT", body: data }),
  getEducation: () => request<Education[]>("/api/profile/education"),
  getDocuments: () => request<Document[]>("/api/documents"),
  getDocumentCategories: () => request<DocumentCategory[]>("/api/documents/categories"),
  uploadDocument: (data: FormData) => request<Document>("/api/profile/documents", { method: "POST", body: data }),
  uploadApplicationDocument: (applicationId: string, data: FormData) => request<Document>(`/api/applications/${applicationId}/documents/upload`, { method: "POST", body: data }),
  replaceDocument: (id: string, data: FormData) => request<Document>(`/api/profile/documents/${id}/file`, { method: "PUT", body: data }),
  deleteDocument: (id: string) => request<void>(`/api/profile/documents/${id}`, { method: "DELETE" }),
  getDigiLockerDocuments: () => request<MockDigiLockerDocument[]>("/api/digilocker/documents"),
  selectApplicationDocuments: (applicationId: string, documentIds: string[]) =>
    request<Document[]>(`/api/applications/${applicationId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: documentIds }),
    }),
  selectMyDocuments: (applicationId: string, documentIds: string[]) =>
    request<Document[]>(`/api/applications/${applicationId}/my-documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: documentIds }),
    }),
  getServices: () => request<GovernmentService[]>("/api/services"),
  getService: (serviceId: string) => request<GovernmentServiceDetail>(`/api/services/${serviceId}`),
  createApplication: (serviceId: string) =>
    request<ApplicationEngineResponse>(`/api/services/${serviceId}/applications`, { method: "POST" }),
  getApplications: () => request<ApplicationSummary[]>("/api/applications"),
  getApplication: (applicationId: string) =>
    request<ApplicationDetail>(`/api/applications/${applicationId}`),
  downloadApplicationPdf: (applicationId: string) => download(`/api/applications/${applicationId}/download`),
  deleteApplication: (applicationId: string) =>
    request<{ id: string }>(`/api/applications/${applicationId}`, { method: "DELETE" }),
  saveAdditionalData: (applicationId: string, answers: Record<string, unknown>) =>
    request<ApplicationEngineResponse>(`/api/applications/${applicationId}/additional-data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    }),
  grantConsent: (applicationId: string) =>
    request<Consent>(`/api/applications/${applicationId}/consent`, { method: "POST" }),
  getPreview: (applicationId: string) =>
    request<ApplicationPreview>(`/api/applications/${applicationId}/preview`),
  finalizeApplication: (applicationId: string) =>
    request<{ id: string; application_id: string }>(`/api/applications/${applicationId}/finalize`, { method: "POST" }),
  processPayment: (applicationId: string) =>
    request<PaymentResult>(`/api/applications/${applicationId}/payment`, { method: "POST" }),
  submitApplication: (applicationId: string) =>
    request<SubmissionResult>(`/api/applications/${applicationId}/submit`, { method: "POST" }),
};
