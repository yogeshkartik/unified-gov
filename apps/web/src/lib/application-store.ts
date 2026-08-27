import type { CitizenApplicationSummary } from "@/src/types";

const storageKey = "unified-gov-demo-applications";

export function getStoredApplications(): CitizenApplicationSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    return Array.isArray(parsed) ? parsed as CitizenApplicationSummary[] : [];
  } catch {
    return [];
  }
}

export function saveApplication(application: CitizenApplicationSummary) {
  const applications = getStoredApplications();
  const index = applications.findIndex((item) => item.id === application.id);
  if (index >= 0) applications[index] = { ...applications[index], ...application };
  else applications.unshift(application);
  window.localStorage.setItem(storageKey, JSON.stringify(applications));
}

export function removeStoredApplication(applicationId: string) {
  const applications = getStoredApplications().filter((application) => application.id !== applicationId);
  window.localStorage.setItem(storageKey, JSON.stringify(applications));
}
