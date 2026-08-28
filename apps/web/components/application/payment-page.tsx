"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

export function PaymentPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
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
              `/applications/${applicationId}/success?reference=${encodeURIComponent(
                submission.government_reference_number
              )}`
            );
          }
        } catch {
          if (!cancelled) {
            setPaymentError("We could not submit this free application. Please try again.");
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
  }, [applicationId, router]);

  async function submitAfterPayment() {
    const submission = await api.submitApplication(applicationId);
    router.replace(
      `/applications/${applicationId}/success?reference=${encodeURIComponent(
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
        setPaymentError("Payment was not successful. Please try again.");
        setProcessing(false);
      }
    } catch {
      setPaymentError("We could not process the payment. Please try again.");
      setProcessing(false);
    }
  }

  if (error) {
    return (
      <ErrorState>
        We could not load payment information. Return to the preview and try again.
      </ErrorState>
    );
  }

  if (!preview) return <LoadingState label="Loading payment details…" />;

  const isFree = preview.fee <= 0;

  return (
    <ApplicationFlowShell
      serviceName={String(preview.service.name)}
      step={4}
      stepName="Payment"
      onClose={() => router.push("/applications")}
      footer={
        !isFree ? (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between sm:items-center">
            <Button
              type="button"
              variant="outline"
              onPress={() => router.push(`/applications/${applicationId}/preview`)}
            >
              Back
            </Button>
            <Button onPress={pay} isDisabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Processing payment…</span>
                </>
              ) : (
                `Pay ${preview.currency} ${preview.fee}`
              )}
            </Button>
          </div>
        ) : null
      }
    >
      {isFree ? (
        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
          <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Submitting free application…</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No payment is required for this service.
            </p>
          </div>
          {paymentError ? (
            <div className="space-y-3 pt-2">
              <p role="alert" className="text-sm text-destructive">
                {paymentError}
              </p>
              <Button onPress={pay} isDisabled={processing}>
                Retry submission
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
              Application fee
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Demo payment · No real money will be charged.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/20 p-6 text-center space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Amount to pay
            </p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              {preview.currency} {preview.fee}
            </p>
            <p className="text-xs text-muted-foreground">
              Mock payment for demonstration purposes
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
