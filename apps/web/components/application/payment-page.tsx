"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, IndianRupee } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationProgress } from "@/components/application/application-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";

export function PaymentPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<ApplicationPreview>();
  const [error, setError] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    api.getPreview(applicationId).then(async (loadedPreview) => {
      if (cancelled) return;
      setPreview(loadedPreview);
      if (loadedPreview.fee > 0) return;
      setProcessing(true);
      try {
        await api.processPayment(applicationId);
        const submission = await api.submitApplication(applicationId);
        if (!cancelled) router.replace(`/applications/${applicationId}/success?reference=${encodeURIComponent(submission.government_reference_number)}`);
      } catch {
        if (!cancelled) { setPaymentError("We could not submit this free application. Please try again."); setProcessing(false); }
      }
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [applicationId, router]);
  async function submitAfterPayment() {
    const submission = await api.submitApplication(applicationId);
    router.replace(`/applications/${applicationId}/success?reference=${encodeURIComponent(submission.government_reference_number)}`);
  }
  async function pay() {
    setProcessing(true);
    setPaymentError(undefined);
    try {
      const payment = await api.processPayment(applicationId);
      if (payment.skipped || payment.status === "SUCCESS") await submitAfterPayment();
      else { setPaymentError("Demo payment was not successful. Please try again."); setProcessing(false); }
    } catch { setPaymentError("We could not process the demo payment. Please try again."); setProcessing(false); }
  }
  if (error) return <ErrorState>We could not load payment information. Return to the preview and try again.</ErrorState>;
  if (!preview) return <LoadingState label="Loading payment details…" />;
  if (preview.fee <= 0) return <div className="mx-auto max-w-xl space-y-6"><ApplicationProgress currentStep={4} /><Card><CardHeader><CardTitle>Submitting free application</CardTitle></CardHeader><CardContent className="space-y-4"><p className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />No payment is required. Your synthetic application is being submitted.</p>{paymentError ? <><p role="alert" className="text-sm text-destructive">{paymentError}</p><Button onPress={pay} isDisabled={processing}>Retry submission</Button></> : null}</CardContent></Card></div>;
  return <div className="mx-auto max-w-xl space-y-6"><ApplicationProgress currentStep={4} /><div><p className="text-sm font-medium text-primary">Demo payment</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Confirm payment</h1><p className="mt-2 leading-6 text-muted-foreground">No real money will be charged. This uses the local mock payment provider.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="size-4 text-primary" aria-hidden="true" />Payment summary</CardTitle></CardHeader><CardContent><dl className="space-y-3 text-sm"><div className="flex justify-between"><dt>Application fee</dt><dd>{preview.currency} {preview.fee}</dd></div><div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd className="flex items-center"><IndianRupee className="size-4" aria-hidden="true" />{preview.fee}</dd></div></dl></CardContent></Card><Button size="lg" className="w-full" onPress={pay} isDisabled={processing}>{processing ? "Processing demo payment…" : `Pay ${preview.currency} ${preview.fee} — Demo`}</Button>{paymentError ? <p role="alert" className="text-sm text-destructive">{paymentError}</p> : null}</div>;
}
