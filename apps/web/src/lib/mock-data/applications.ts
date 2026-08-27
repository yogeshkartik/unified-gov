import type { Application } from "@/src/types";

// The backend does not yet expose a collection endpoint for applications.
export const demoApplications: Application[] = [
  {
    id: "APP-DEMO-001",
    user_id: "demo-citizen",
    service_id: "RECRUITMENT_EXAM_DEMO",
    status: "SUBMITTED",
    answers: {},
    created_at: "2026-08-12T09:30:00Z",
    updated_at: "2026-08-12T09:30:00Z",
  },
];
