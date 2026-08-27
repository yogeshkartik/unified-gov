import type {
  ApplicationEngineResponse,
  ApplicationPreview,
  CitizenProfile,
  Consent,
  Document,
  Education,
  GovernmentService,
  GovernmentServiceDetail,
  PaymentResult,
  MockDigiLockerDocument,
  SubmissionResult,
} from "@/src/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null && "detail" in body) {
        message = typeof body.detail === "string" ? body.detail : message;
      }
    } catch {
      // Keep the safe fallback message when an error response is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getProfile: () => request<CitizenProfile>("/api/profile"),
  getEducation: () => request<Education[]>("/api/profile/education"),
  getDocuments: () => request<Document[]>("/api/documents"),
  getDigiLockerDocuments: () => request<MockDigiLockerDocument[]>("/api/digilocker/documents"),
  getServices: () => request<GovernmentService[]>("/api/services"),
  getService: (serviceId: string) => request<GovernmentServiceDetail>(`/api/services/${serviceId}`),
  createApplication: (serviceId: string) =>
    request<ApplicationEngineResponse>(`/api/services/${serviceId}/applications`, { method: "POST" }),
  getApplication: (applicationId: string) =>
    request<ApplicationEngineResponse>(`/api/applications/${applicationId}`),
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
