import { CheckCircle2, Circle } from "lucide-react";
import type { ApplicationStatus } from "@/src/types";

const stages: Array<{ label: string; statuses: ApplicationStatus[] }> = [
  { label: "Application created", statuses: ["DRAFT", "ADDITIONAL_INFO_REQUIRED", "CONSENT_REQUIRED", "READY_FOR_REVIEW", "PAYMENT_REQUIRED", "SUBMITTED", "PROCESSING", "COMPLETED"] },
  { label: "Additional details completed", statuses: ["CONSENT_REQUIRED", "READY_FOR_REVIEW", "PAYMENT_REQUIRED", "SUBMITTED", "PROCESSING", "COMPLETED"] },
  { label: "Consent granted", statuses: ["READY_FOR_REVIEW", "PAYMENT_REQUIRED", "SUBMITTED", "PROCESSING", "COMPLETED"] },
  { label: "Payment completed or skipped", statuses: ["READY_FOR_REVIEW", "SUBMITTED", "PROCESSING", "COMPLETED"] },
  { label: "Application submitted", statuses: ["SUBMITTED", "PROCESSING", "COMPLETED"] },
];

export function ApplicationTimeline({ status }: { status: ApplicationStatus }) {
  return <ol className="space-y-4">{stages.map((stage) => { const complete = stage.statuses.includes(status); return <li key={stage.label} className="flex items-center gap-3 text-sm"><span className="grid size-5 place-items-center" aria-hidden="true">{complete ? <CheckCircle2 className="size-5 text-primary" /> : <Circle className="size-5 text-muted-foreground" />}</span><span className={complete ? "font-medium text-foreground" : "text-muted-foreground"}>{stage.label}{complete ? <span className="sr-only"> — complete</span> : <span className="sr-only"> — not complete</span>}</span></li>; })}</ol>;
}
