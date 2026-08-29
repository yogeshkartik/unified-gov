"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { api } from "@/src/lib/api";
import type { ApplicationPreview } from "@/src/types";
import { ApplicationFlowShell } from "@/components/application/application-flow-shell";
import { applicationFlowSteps } from "@/components/application/application-flow-navigation";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

function SuccessReveal({ delay, play, children, reference }: { delay: number; play: boolean; children: ReactNode; reference?: boolean }) {
  const reduceMotion = useReducedMotion();
  const initial = play && !reduceMotion ? reference ? { opacity: 0, y: 6, scale: 0.98 } : { opacity: 0, y: 6 } : false;
  return <motion.div initial={initial} animate={{ opacity: 1, y: 0, scale: 1 }} transition={play && !reduceMotion ? { duration: 0.28, delay, ease: "easeOut" } : { duration: 0 }}>{children}</motion.div>;
}

function SubmissionSuccessIcon({ play }: { play: boolean }) {
  const reduceMotion = useReducedMotion();
  const animate = play && !reduceMotion;
  return <div className="relative grid size-14 place-items-center">
    {animate ? <motion.span aria-hidden="true" className="absolute inset-0 rounded-full border border-emerald-300" initial={{ opacity: 0.25, scale: 0.6 }} animate={{ opacity: 0, scale: 1.6 }} transition={{ duration: 0.55, ease: "easeOut" }} /> : null}
    <motion.div className="relative grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700" initial={animate ? { opacity: 0, scale: 0.3 } : false} animate={{ opacity: 1, scale: animate ? [1, 1.04, 1] : 1 }} transition={{ duration: animate ? 0.55 : 0, times: [0, 0.8, 1], ease: "easeOut" }}>
      <svg viewBox="0 0 36 36" className="size-8" aria-label="Success" role="img"><motion.path d="M 8.5 18.5 L 14.5 24.5 L 27.5 11.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={animate ? { pathLength: 0, opacity: 0 } : false} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: animate ? 0.36 : 0, delay: animate ? 0.15 : 0, ease: "easeOut" }} /></svg>
    </motion.div>
  </div>;
}

export function SuccessPage({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useCitizenPreferences();
  const [preview, setPreview] = useState<ApplicationPreview>();
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const submittedReference = searchParams.get("reference");
  const playSuccessAnimation = Boolean(submittedReference);
  useEffect(() => { api.getPreview(applicationId).then(setPreview).catch(() => setError(true)); }, [applicationId]);
  if (error) return <ErrorState>{t("submissionSummaryLoadError")}</ErrorState>;
  if (!preview) return <LoadingState label={t("loadingSubmissionConfirmation")} />;

  const reference = submittedReference ?? `GOV-DEMO-${applicationId.slice(0, 8).toUpperCase()}`;
  async function handleCopy() { try { await navigator.clipboard.writeText(reference); setCopied(true); window.setTimeout(() => setCopied(false), 2500); } catch { /* Clipboard fallback */ } }
  const footer = <SuccessReveal delay={0.9} play={playSuccessAnimation}><div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="outline" onPress={() => router.push(`/applications/${applicationId}/apply?step=preview`)}>{t("viewApplication")}</Button><Button onPress={() => router.push("/applications")}>{t("done")}</Button></div></SuccessReveal>;

  return <ApplicationFlowShell serviceName={String(preview.service.name)} applicationId={applicationId} step={applicationFlowSteps.success.index} stepName={t("submittedStep")} onClose={() => router.push("/applications")} footer={footer}>
    <div className="flex flex-col items-center space-y-4 py-4 text-center sm:py-6">
      <SubmissionSuccessIcon play={playSuccessAnimation} />
      <SuccessReveal delay={0.5} play={playSuccessAnimation}><h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t("applicationSubmitted")}</h1></SuccessReveal>
      <SuccessReveal delay={0.6} play={playSuccessAnimation}><p className="text-sm text-muted-foreground">{String(preview.service.name)}</p></SuccessReveal>
      <SuccessReveal delay={0.7} play={playSuccessAnimation} reference><div className="w-full max-w-xs rounded-lg border border-border bg-muted/20 p-3.5"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("reference")}</p><div className="mt-1 flex items-center justify-center gap-2"><span className="min-w-0 break-all font-mono text-base font-bold tracking-wide text-foreground">{reference}</span><Button type="button" variant="ghost" size="icon-sm" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground" onPress={handleCopy} aria-label={t("copyReferenceNumber")}>{copied ? <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}</Button></div>{copied ? <p className="mt-1 text-xs font-medium text-emerald-700">{t("copiedToClipboard")}</p> : null}</div></SuccessReveal>
      <SuccessReveal delay={0.84} play={playSuccessAnimation}><p className="text-xs text-muted-foreground">{t("prototypeSubmissionOnly")}</p></SuccessReveal>
    </div>
  </ApplicationFlowShell>;
}
