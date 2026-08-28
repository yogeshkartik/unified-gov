export const applicationFlowSteps = {
  additional: { route: "additional", index: 1, label: "Additional information" },
  consent: { route: "consent", index: 2, label: "Consent" },
  preview: { route: "preview", index: 3, label: "Preview" },
  payment: { route: "payment", index: 4, label: "Payment" },
  success: { route: "success", index: 5, label: "Submitted" },
} as const;

export type ApplicationFlowStep = keyof typeof applicationFlowSteps;
export type ApplicationFlowDirection = "forward" | "back";
let navigationInProgress = false;

export function applicationFlowPath(applicationId: string, step: ApplicationFlowStep) {
  return `/applications/${applicationId}/apply?step=${applicationFlowSteps[step].route}`;
}

export function flowDirectionKey(applicationId: string) {
  return `unified-gov:application-flow-direction:${applicationId}`;
}

export function navigateApplicationFlow(
  router: { push: (href: string) => void },
  applicationId: string,
  step: ApplicationFlowStep,
  direction: ApplicationFlowDirection
) {
  if (navigationInProgress) return;
  navigationInProgress = true;
  window.sessionStorage.setItem(flowDirectionKey(applicationId), direction);
  router.push(applicationFlowPath(applicationId, step));
  window.setTimeout(() => {
    navigationInProgress = false;
  }, 250);
}
