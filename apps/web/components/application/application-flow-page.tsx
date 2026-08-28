"use client";

import { useSearchParams } from "next/navigation";
import { AdditionalInformation } from "@/components/application/additional-information";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { applicationFlowSteps, type ApplicationFlowStep } from "@/components/application/application-flow-navigation";
import { ConsentPage } from "@/components/application/consent-page";
import { PaymentPage } from "@/components/application/payment-page";
import { PreviewPage } from "@/components/application/preview-page";
import { SuccessPage } from "@/components/application/success-page";

const validSteps = Object.keys(applicationFlowSteps) as ApplicationFlowStep[];

export function ApplicationFlowPage({ applicationId }: { applicationId: string }) {
  const searchParams = useSearchParams();
  const requestedStep = searchParams.get("step") as ApplicationFlowStep | null;
  const step = requestedStep && validSteps.includes(requestedStep) ? requestedStep : "additional";
  const details = applicationFlowSteps[step];

  return (
    <ApplicationFlowShell serviceName="Application" applicationId={applicationId} step={details.index} stepName={details.label}>
      {step === "additional" ? <AdditionalInformation applicationId={applicationId} /> : null}
      {step === "consent" ? <ConsentPage applicationId={applicationId} /> : null}
      {step === "preview" ? <PreviewPage applicationId={applicationId} /> : null}
      {step === "payment" ? <PaymentPage applicationId={applicationId} /> : null}
      {step === "success" ? <SuccessPage applicationId={applicationId} /> : null}
    </ApplicationFlowShell>
  );
}
