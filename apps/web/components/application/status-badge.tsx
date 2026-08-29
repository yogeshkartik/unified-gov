"use client";

import { Badge } from "@/components/ui/badge";
import { useCitizenPreferences, type Language } from "@/components/providers/citizen-preferences";
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

const hindiLabels: Record<ApplicationStatus, string> = {
  DRAFT: "मसौदा", ADDITIONAL_INFO_REQUIRED: "अतिरिक्त जानकारी आवश्यक", CONSENT_REQUIRED: "सहमति आवश्यक",
  READY_FOR_REVIEW: "समीक्षा के लिए तैयार", PAYMENT_REQUIRED: "भुगतान लंबित", SUBMITTED: "जमा किया गया",
  PROCESSING: "प्रक्रिया में", COMPLETED: "पूरा हुआ", REJECTED: "अस्वीकृत", CANCELLED: "रद्द",
};

export function statusLabel(status: ApplicationStatus, language: Language = "en") { return language === "hi" ? hindiLabels[status] : labels[status]; }

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { language } = useCitizenPreferences();
  const variant = status === "REJECTED" || status === "CANCELLED" ? "destructive" : status === "SUBMITTED" || status === "COMPLETED" ? "default" : "secondary";
  return <Badge variant={variant}>{statusLabel(status, language)}</Badge>;
}
