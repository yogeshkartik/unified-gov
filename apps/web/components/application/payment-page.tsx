"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { applicationFlowSteps, navigateApplicationFlow } from "@/components/application/application-flow-navigation";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeServiceName } from "@/src/i18n/service-localization";
import { localeFor } from "@/src/i18n/locale-format";

export function PaymentPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { language, t } = useCitizenPreferences();
  const [preview, setPreview] = useState<ApplicationPreview>();
  const [error, setError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    api
      .getPreview(applicationId)
      .then(async (loadedPreview) => {
        if (cancelled) return;
        setPreview(loadedPreview);
        if (loadedPreview.fee > 0) return;
        setProcessing(true);
        try {
          await api.processPayment(applicationId);
          const submission = await api.submitApplication(applicationId);
          if (!cancelled) {
            router.replace(
              `/applications/${applicationId}/apply?step=success&reference=${encodeURIComponent(
                submission.government_reference_number
              )}`
            );
          }
        } catch {
          if (!cancelled) {
            setPaymentError(t("freeSubmissionError"));
            setProcessing(false);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, router, t]);

  async function submitAfterPayment() {
    const submission = await api.submitApplication(applicationId);
    router.replace(
      `/applications/${applicationId}/apply?step=success&reference=${encodeURIComponent(
        submission.government_reference_number
      )}`
    );
  }

  async function pay() {
    setProcessing(true);
    setPaymentError(undefined);
    try {
      const payment = await api.processPayment(applicationId);
      if (payment.skipped || payment.status === "SUCCESS") {
        await submitAfterPayment();
      } else {
        setPaymentError(t("paymentFailed"));
        setProcessing(false);
      }
    } catch {
      setPaymentError(t("paymentProcessError"));
      setProcessing(false);
    }
  }

  if (error) {
    return (
      <ErrorState>
        {t("paymentLoadError")}
      </ErrorState>
    );
  }

  if (!preview) return <LoadingState label={t("loadingPaymentDetails")} />;

  const isFree = preview.fee <= 0;

  return (
    <ApplicationFlowShell
      serviceName={localizeServiceName(String(preview.service.id), String(preview.service.name), language)}
      applicationId={applicationId}
      step={applicationFlowSteps.payment.index}
      stepName={t("paymentStep")}
      onClose={() => router.push("/applications")}
      footer={
        !isFree ? (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
            <Button
              type="button"
              variant="outline"
              onPress={() => navigateApplicationFlow(router, applicationId, "preview", "back")}
            >
              {t("back")}
            </Button>
            <Button onPress={pay} isDisabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("processingPayment")}</span>
                </>
              ) : (
                t("payAmount", { amount: new Intl.NumberFormat(localeFor(language), { style: "currency", currency: preview.currency }).format(preview.fee) })
              )}
            </Button>
          </div>
        ) : null
      }
    >
      {isFree ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <Loader2 className="size-7 animate-spin text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-base font-medium text-foreground">{t("submittingFreeApplication")}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("paymentNotRequired")}</p>
          </div>
          {paymentError ? (
            <div className="space-y-3 pt-2">
              <p role="alert" className="text-sm text-destructive">
                {paymentError}
              </p>
              <Button onPress={pay} isDisabled={processing}>
                {t("retrySubmission")}
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {t("applicationFee")}
          </h1>

          <div className="rounded-lg border bg-muted/20 p-6 text-center space-y-1.5">
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {new Intl.NumberFormat(localeFor(language), { style: "currency", currency: preview.currency }).format(preview.fee)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("demoPaymentNotice")}
            </p>
          </div>

          {paymentError ? (
            <p role="alert" className="text-sm text-destructive">
              {paymentError}
            </p>
          ) : null}
        </div>
      )}
    </ApplicationFlowShell>
  );
}
