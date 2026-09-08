"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationDocumentActionResponse, ApplicationProgress, ApplicationQuestion, ChatComponent, ChatServiceCard, GrantChatConsentResponse, PayChatApplicationResponse, SubmitChatApplicationResponse } from "@/src/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localeFor } from "@/src/i18n/locale-format";
import { ApplicationQuestionCard } from "@/components/chat/application-question";
import { DocumentRequestCard } from "@/components/chat/document-request";
import { ReviewCard } from "@/components/chat/review-card";
import { ConsentCard } from "@/components/chat/consent-card";
import { PaymentCard } from "@/components/chat/payment-card";
import { SubmissionConfirmation } from "@/components/chat/submission-confirmation";
import { SubmissionSuccess } from "@/components/chat/submission-success";
import { localizeServiceFieldLabel } from "@/src/i18n/service-localization";

type Message = { id: string; role: "user" | "assistant"; content: string; components?: ChatComponent[] };

function ServiceCard({ service, applying, onApply }: { service: ChatServiceCard; applying: boolean; onApply: (service: ChatServiceCard) => void }) {
  const { language, t } = useCitizenPreferences();
  const fee = service.fee > 0 ? new Intl.NumberFormat(localeFor(language), { style: "currency", currency: service.currency, maximumFractionDigits: 0 }).format(service.fee) : t("free");
  return <article className="mt-3 w-full max-w-2xl rounded-xl border bg-card p-4 text-foreground shadow-sm"><p className="font-semibold">{service.name}</p><p className="mt-1 text-xs text-muted-foreground">{service.department} · {service.category}</p><p className="mt-2 text-sm text-muted-foreground">{service.description}</p><p className="mt-4 text-sm font-medium">{t("fee", { amount: fee })}</p><div className="mt-4 flex flex-wrap items-center gap-2"><Button size="sm" onPress={() => onApply(service)} isDisabled={applying}>{applying ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("startingApplication")}</> : t("applyNow")}</Button><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/services/${service.service_id}`}>{t("viewDetails")}</Link></div></article>;
}

function ProgressRow({ label, value, complete }: { label: string; value: string; complete?: boolean }) { return <div className="flex items-start justify-between gap-3 py-1.5"><dt className="text-muted-foreground">{label}</dt><dd className="flex items-center gap-1 text-right font-medium">{complete ? <CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" /> : null}{value}</dd></div>; }

function ApplicationProgressCard({ progress }: { progress: ApplicationProgress }) {
  const { language, t } = useCitizenPreferences();
  const count = (missing: unknown[]) => missing.length === 0 ? t("completeStatus") : t("missingCount", { count: missing.length });
  const payment = progress.payment.required ? new Intl.NumberFormat(localeFor(language), { style: "currency", currency: progress.payment.currency, maximumFractionDigits: 0 }).format(progress.payment.amount) : t("noPaymentRequired");
  const submissionComplete = progress.next_stage === "COMPLETE";
  return <section className="mt-2 rounded-lg border bg-card p-3 text-foreground" aria-label={t("applicationProgress")}><p className="font-semibold">{progress.service.name}</p><p className="mt-1 text-xs text-muted-foreground">{t("applicationInProgress")}</p><dl className="mt-3 divide-y"><ProgressRow label={t("profileInformation")} value={count(progress.profile.missing)} complete={progress.profile.missing.length === 0} /><ProgressRow label={t("additionalInformation")} value={count(progress.application_fields.missing)} complete={progress.application_fields.missing.length === 0} /><ProgressRow label={t("documents")} value={count(progress.documents.missing)} complete={progress.documents.missing.length === 0} /><ProgressRow label={t("consent")} value={progress.consent.granted ? t("completeStatus") : t("pendingStatus")} complete={progress.consent.granted} /><ProgressRow label={t("payment")} value={payment} complete={!progress.payment.required || progress.payment.status === "COMPLETED"} /><ProgressRow label={t("submission")} value={submissionComplete ? t("completeStatus") : progress.ready_for_submission ? t("readyStatus") : t("notReadyStatus")} complete={submissionComplete || progress.ready_for_submission} /></dl><p className="mt-3 text-sm font-medium">{t("nextStage", { stage: t(`stage${progress.next_stage}` as "stagePROFILE") })}</p></section>;
}

export function CitizenAssistant() {
  const { language, t } = useCitizenPreferences();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [applyingServiceId, setApplyingServiceId] = useState<string>();
  const [activeApplicationId, setActiveApplicationId] = useState<string>();
  const [error, setError] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reviewedApplications, setReviewedApplications] = useState<Set<string>>(() => new Set());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages, busy]);
  const isEmpty = messages.length <= 1;
  async function reviewComponents(progress: ApplicationProgress): Promise<ChatComponent[]> {
    if (!progress.ready_for_consent) return [];
    try {
      const result = await api.getChatApplicationReview(progress.application_id);
      return [result.review, ...(result.consent_card ? [result.consent_card] : [])];
    } catch {
      return [];
    }
  }
  async function transactionComponents(progress: ApplicationProgress): Promise<ChatComponent[]> {
    if (!["PAYMENT", "SUBMISSION", "COMPLETE"].includes(progress.next_stage)) return [];
    try {
      const result = await api.getChatTransactionComponents(progress.application_id);
      return [
        ...(result.payment_card ? [result.payment_card] : []),
        ...(result.submission_confirmation ? [result.submission_confirmation] : []),
        ...(result.submission_success ? [result.submission_success] : []),
      ];
    } catch { return []; }
  }
  async function stageComponents(progress: ApplicationProgress): Promise<ChatComponent[]> {
    const [review, transaction] = await Promise.all([reviewComponents(progress), transactionComponents(progress)]);
    return [...review, ...transaction];
  }
  async function send(value = draft) {
    const text = value.trim(); if (!text || busy) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const history = messages.filter((message) => message.id !== "welcome").slice(-12).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, userMessage]); setDraft(""); setBusy(true); setError(false);
    try { const response = await api.sendChat(text, history, language, activeApplicationId); setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: response.message, components: response.components }]); const progress = response.components.find((component): component is ApplicationProgress => component.type === "APPLICATION_PROGRESS"); if (progress) setActiveApplicationId(progress.application_id); }
    catch { setError(true); }
    finally { setBusy(false); inputRef.current?.focus(); }
  }
  async function apply(service: ChatServiceCard) {
    if (applyingServiceId) return;
    setApplyingServiceId(service.service_id); setError(false);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: t("applyForService", { name: service.name }) }]);
    try { const result = await api.startChatApplication(service.service_id); const stage = await stageComponents(result.progress); setActiveApplicationId(result.application_id); setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: stage.some((component) => component.type === "REVIEW_CARD") ? t("reviewReadyMessage") : t(result.result === "CREATED" ? "applicationStartedMessage" : "applicationResumedMessage"), components: [result.progress, ...(result.next_question ? [result.next_question] : []), ...(result.next_document ? [result.next_document] : []), ...stage] }]); }
    catch { setError(true); }
    finally { setApplyingServiceId(undefined); inputRef.current?.focus(); }
  }
  async function saveQuestion(question: ApplicationQuestion, value: unknown, displayValue: string) {
    const result = await api.setChatApplicationField(question.application_id, question.field.key, value);
    setActiveApplicationId(question.application_id);
    const fieldLabel = localizeServiceFieldLabel(question.field.key, question.field.label, language);
    const stage = await stageComponents(result.progress);
    setMessages((current) => [...current,
      { id: crypto.randomUUID(), role: "user", content: t("answerForField", { field: fieldLabel, value: displayValue }) },
      { id: crypto.randomUUID(), role: "assistant", content: stage.some((component) => component.type === "REVIEW_CARD") ? t("reviewReadyMessage") : t(result.next_question ? "answerSavedMessage" : "additionalInformationComplete"), components: [result.progress, ...(result.next_question ? [result.next_question] : []), ...(result.next_document ? [result.next_document] : []), ...stage] },
    ]);
  }
  async function documentAttached(result: ApplicationDocumentActionResponse) {
    const stage = await stageComponents(result.progress);
    setActiveApplicationId(result.progress.application_id);
    setMessages((current) => [...current, {
      id: crypto.randomUUID(),
      role: "assistant",
      content: stage.some((component) => component.type === "REVIEW_CARD")
        ? t("reviewReadyMessage")
        : result.next_document
        ? t("chatDocumentAttached", { name: result.attached_document.name })
        : t("chatDocumentsComplete"),
      components: [result.progress, ...(result.next_document ? [result.next_document] : []), ...stage],
    }]);
  }
  async function consentGranted(result: GrantChatConsentResponse) {
    const transaction = await transactionComponents(result.progress);
    setMessages((current) => [...current.map((message) => ({ ...message, components: message.components?.filter((component) => component.type !== "CONSENT_CARD" || component.application_id !== result.progress.application_id) })), { id: crypto.randomUUID(), role: "assistant", content: t("consentRecordedMessage"), components: [result.review, result.progress, ...transaction] }]);
  }
  async function consentRejected(applicationId: string) {
    try {
      const progress = await api.getChatApplicationProgress(applicationId);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: t("progressRefreshedMessage"), components: [progress] }]);
    } catch {}
  }
  function paymentCompleted(result: PayChatApplicationResponse) {
    setMessages((current) => [...current.map((message) => ({ ...message, components: message.components?.filter((component) => component.type !== "PAYMENT_CARD" || component.application_id !== result.progress.application_id) })), { id: crypto.randomUUID(), role: "assistant", content: t("demoPaymentCompleted"), components: [result.payment_card, result.progress, ...(result.submission_confirmation ? [result.submission_confirmation] : [])] }]);
  }
  function submissionCompleted(result: SubmitChatApplicationResponse) {
    const applicationId = result.progress.application_id;
    const actionable = new Set(["TEXT_QUESTION", "TEXTAREA_QUESTION", "SELECT_QUESTION", "BOOLEAN_QUESTION", "NUMBER_QUESTION", "DOCUMENT_REQUEST", "CONSENT_CARD", "PAYMENT_CARD", "SUBMISSION_CONFIRMATION"]);
    setMessages((current) => [...current.map((message) => ({ ...message, components: message.components?.filter((component) => !("application_id" in component && component.application_id === applicationId && actionable.has(component.type))) })), { id: crypto.randomUUID(), role: "assistant", content: t("applicationSubmittedMessage"), components: [result.progress, result.success] }]);
  }
  return <>
    <Button className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg sm:right-6 sm:bottom-6" onPress={() => { if (messages.length === 0) setMessages([{ id: "welcome", role: "assistant", content: t("chatWelcome") }]); setOpen(true); }} aria-label={t("openAssistant")}><Bot aria-hidden="true" /> <span className="hidden sm:inline">{t("assistant")}</span></Button>
    {open ? <Dialog isOpen={open} onOpenChange={setOpen} showCloseButton={false} className="h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[1280px] gap-0 overflow-hidden rounded-xl p-0 shadow-2xl sm:h-[88vh] sm:w-[90vw] sm:!max-w-[1280px] lg:w-[88vw] [&_[data-slot=dialog]]:grid [&_[data-slot=dialog]]:h-full [&_[data-slot=dialog]]:min-h-0 [&_[data-slot=dialog]]:grid-rows-[auto_minmax(0,1fr)] [&_[data-slot=dialog]]:gap-0" overlayClassName="z-50 bg-black/45 backdrop-blur-sm">
      <DialogHeader className="flex-row items-center justify-between border-b bg-muted/20 px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Bot className="size-5" aria-hidden="true" /></span><div><DialogTitle>{t("assistant")}</DialogTitle><p className="mt-0.5 text-xs text-muted-foreground">{t("askGovernmentService")}</p></div></div><Button variant="ghost" size="icon-sm" onPress={() => setOpen(false)} aria-label={t("closeAssistant")}><X aria-hidden="true" /></Button></DialogHeader>
      <div className="flex h-full min-h-0 flex-col overflow-hidden"><div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite"><div className="mx-auto w-full max-w-4xl space-y-4">{isEmpty ? <div className="flex min-h-[min(46vh,420px)] flex-col items-center justify-center px-4 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bot className="size-7" aria-hidden="true" /></span><h3 className="mt-5 text-xl font-semibold">{t("assistant")}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("chatWelcome")}</p></div> : messages.map((message) => <div key={message.id} className={message.role === "user" ? "ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground" : "max-w-3xl min-w-0 rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm"}>{message.content}{message.components?.map((component) => component.type === "SERVICE_CARD" ? <ServiceCard key={`service-${component.service_id}`} service={component} applying={applyingServiceId === component.service_id} onApply={apply} /> : component.type === "APPLICATION_PROGRESS" ? <ApplicationProgressCard key={`application-${component.application_id}`} progress={component} /> : component.type === "DOCUMENT_REQUEST" ? <DocumentRequestCard key={`document-${component.application_id}-${component.requirement.id}`} request={component} onAttached={documentAttached} /> : component.type === "REVIEW_CARD" ? <ReviewCard key={`review-${component.application_id}`} review={component} onContinue={() => setReviewedApplications((current) => new Set(current).add(component.application_id))} /> : component.type === "CONSENT_CARD" ? reviewedApplications.has(component.application_id) ? <ConsentCard key={`consent-${component.application_id}`} card={component} onGranted={consentGranted} onRejected={() => consentRejected(component.application_id)} /> : null : component.type === "PAYMENT_CARD" ? <PaymentCard key={`payment-${component.application_id}`} card={component} onPaid={paymentCompleted} onRejected={() => consentRejected(component.application_id)} /> : component.type === "SUBMISSION_CONFIRMATION" ? <SubmissionConfirmation key={`submission-${component.application_id}`} card={component} onSubmitted={submissionCompleted} onRejected={() => consentRejected(component.application_id)} /> : component.type === "SUBMISSION_SUCCESS" ? <SubmissionSuccess key={`success-${component.application_id}`} success={component} /> : <ApplicationQuestionCard key={`question-${component.application_id}-${component.field.key}`} question={component} onSave={saveQuestion} />)}</div>)}{busy || applyingServiceId ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{applyingServiceId ? t("startingApplication") : t("chatThinking")}</p> : null}{error ? <p role="alert" className="text-sm text-destructive">{t("chatError")}</p> : null}<div ref={bottomRef} /></div></div>
        {isEmpty ? <div className="mx-auto flex w-full max-w-4xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6">{[t("chatPromptIncome"), t("chatPromptKisan")].map((prompt) => <Button key={prompt} size="sm" variant="outline" className="shrink-0" onPress={() => send(prompt)}>{prompt}</Button>)}</div> : null}
        <form className="border-t bg-background/95 px-4 py-3 supports-backdrop-filter:bg-background/80 sm:px-6" onSubmit={(event) => { event.preventDefault(); send(); }}><div className="mx-auto flex w-full max-w-4xl items-end gap-2 rounded-2xl border bg-muted/30 p-2 shadow-sm"><label className="sr-only" htmlFor="citizen-assistant-input">{t("askGovernmentService")}</label><Textarea id="citizen-assistant-input" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={t("askGovernmentService")} rows={2} className="min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={busy} /><Button type="submit" size="icon" className="shrink-0 rounded-xl" isDisabled={busy || !draft.trim()} aria-label={t("send")}><Send aria-hidden="true" /></Button></div></form>
      </div>
    </Dialog> : null}
  </>;
}
