import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/src/types";

const labels: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  ADDITIONAL_INFO_REQUIRED: "Additional information needed",
  CONSENT_REQUIRED: "Consent needed",
  READY_FOR_REVIEW: "Ready for review",
  PAYMENT_REQUIRED: "Payment pending",
  SUBMITTED: "Submitted",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function statusLabel(status: ApplicationStatus) { return labels[status]; }

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const variant = status === "REJECTED" || status === "CANCELLED" ? "destructive" : status === "SUBMITTED" || status === "COMPLETED" ? "default" : "secondary";
  return <Badge variant={variant}>{statusLabel(status)}</Badge>;
}
