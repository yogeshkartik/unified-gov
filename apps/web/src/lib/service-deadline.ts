import type { GovernmentService } from "@/src/types";

/** The catalog's canonical classification for services with application deadlines. */
export function isExaminationService(service: Pick<GovernmentService, "category">) {
  return service.category === "Examinations";
}

export function displayDeadline(service: GovernmentService) {
  return isExaminationService(service) ? service.end_date : null;
}
