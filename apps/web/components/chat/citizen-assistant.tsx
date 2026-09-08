"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, LoaderCircle, Send, Sparkles, X } from "lucide-react";
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
  return <article className="min-w-0 rounded-xl border bg-card p-4 text-foreground shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{service.name}</p><p className="mt-1 text-xs text-muted-foreground">{service.department}</p></div><span className="shrink-0 rounded-full bg-primary/8 px-2.5 py-1 text-xs font-medium text-primary">{service.category}</span></div><p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">{service.description}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3"><p className="text-sm font-medium">{t("fee", { amount: fee })}</p><div className="flex items-center gap-3"><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/services/${service.service_id}`}>{t("viewDetails")}</Link><Button size="sm" onPress={() => onApply(service)} isDisabled={applying}>{applying ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("startingApplication")}</> : t("applyNow")}</Button></div></div></article>;
}

function ApplicationProgressCard({ progress }: { progress: ApplicationProgress }) {
  const { t } = useCitizenPreferences();
  const stageIndex = ["PROFILE", "ADDITIONAL_INFORMATION", "DOCUMENTS", "CONSENT", "REVIEW", "PAYMENT", "SUBMISSION", "COMPLETE"].indexOf(progress.next_stage);
  const stages = [t("profileInformation"), t("additionalInformation"), t("documents"), t("reviewApplication"), t("submission")];
  const visibleStage = Math.min(Math.max(stageIndex === -1 ? 0 : stageIndex <= 2 ? stageIndex : stageIndex <= 4 ? 3 : 4, 0), stages.length - 1);
  return <section className="mt-3 max-w-3xl rounded-xl border bg-card p-4 text-foreground" aria-label={t("applicationProgress")}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{progress.service.name}</p><p className="mt-1 text-xs text-muted-foreground">{t("nextStage", { stage: t(`stage${progress.next_stage}` as "stagePROFILE") })}</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">{t("applicationInProgress")}</span></div><ol className="mt-4 grid grid-cols-5 gap-1" aria-label={t("applicationProgress")}>{stages.map((stage, index) => <li key={stage} className="min-w-0"><span className={`block h-1.5 rounded-full ${index <= visibleStage ? "bg-primary" : "bg-muted"}`} /><span className={`mt-1.5 block truncate text-[11px] ${index === visibleStage ? "font-medium text-foreground" : "text-muted-foreground"}`}>{stage}</span></li>)}</ol></section>;
}

function MessageComponents({ components, applyingServiceId, reviewedApplications, onApply, onDocumentAttached, onReview, onConsentGranted, onConsentRejected, onPaid, onSubmitted, onSave }: { components: ChatComponent[]; applyingServiceId?: string; reviewedApplications: Set<string>; onApply: (service: ChatServiceCard) => void; onDocumentAttached: (result: ApplicationDocumentActionResponse) => void; onReview: (applicationId: string) => void; onConsentGranted: (result: GrantChatConsentResponse) => void; onConsentRejected: (applicationId: string) => void; onPaid: (result: PayChatApplicationResponse) => void; onSubmitted: (result: SubmitChatApplicationResponse) => void; onSave: (question: ApplicationQuestion, value: unknown, displayValue: string) => Promise<void> }) {
  const services = components.filter((component): component is ChatServiceCard => component.type === "SERVICE_CARD");
  const remaining = components.filter((component) => component.type !== "SERVICE_CARD");
  return <div className="mt-3 space-y-3">{services.length ? <div className={`grid gap-3 ${services.length > 1 ? "lg:grid-cols-2" : "max-w-3xl"}`}>{services.map((service) => <ServiceCard key={`service-${service.service_id}`} service={service} applying={applyingServiceId === service.service_id} onApply={onApply} />)}</div> : null}{remaining.map((component) => component.type === "APPLICATION_PROGRESS" ? <ApplicationProgressCard key={`application-${component.application_id}`} progress={component} /> : component.type === "DOCUMENT_REQUEST" ? <DocumentRequestCard key={`document-${component.application_id}-${component.requirement.id}`} request={component} onAttached={onDocumentAttached} /> : component.type === "REVIEW_CARD" ? <ReviewCard key={`review-${component.application_id}`} review={component} onContinue={() => onReview(component.application_id)} /> : component.type === "CONSENT_CARD" ? reviewedApplications.has(component.application_id) ? <ConsentCard key={`consent-${component.application_id}`} card={component} onGranted={onConsentGranted} onRejected={() => onConsentRejected(component.application_id)} /> : null : component.type === "PAYMENT_CARD" ? <PaymentCard key={`payment-${component.application_id}`} card={component} onPaid={onPaid} onRejected={() => onConsentRejected(component.application_id)} /> : component.type === "SUBMISSION_CONFIRMATION" ? <SubmissionConfirmation key={`submission-${component.application_id}`} card={component} onSubmitted={onSubmitted} onRejected={() => onConsentRejected(component.application_id)} /> : component.type === "SUBMISSION_SUCCESS" ? <SubmissionSuccess key={`success-${component.application_id}`} success={component} /> : <ApplicationQuestionCard key={`question-${component.application_id}-${component.field.key}`} question={component} onSave={onSave} />)}</div>;
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
  useEffect(() => {
    const openFromDashboard = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (messages.length === 0) setMessages([{ id: "welcome", role: "assistant", content: t("chatWelcome") }]);
      setOpen(true);
      if (prompt) void send(prompt);
      else window.setTimeout(() => inputRef.current?.focus(), 0);
    };
    window.addEventListener("citizen-assistant:open", openFromDashboard);
    return () => window.removeEventListener("citizen-assistant:open", openFromDashboard);
  }, [messages.length, t]);
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
    <Button className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg sm:right-6 sm:bottom-6 sm:hidden" onPress={() => { if (messages.length === 0) setMessages([{ id: "welcome", role: "assistant", content: t("chatWelcome") }]); setOpen(true); }} aria-label={t("openAssistant")}><Bot aria-hidden="true" /></Button>
    {open ? <Dialog isOpen={open} onOpenChange={setOpen} showCloseButton={false} className="h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[1280px] gap-0 overflow-hidden rounded-xl p-0 shadow-2xl sm:h-[88vh] sm:w-[90vw] sm:!max-w-[1280px] lg:w-[88vw] [&_[data-slot=dialog]]:grid [&_[data-slot=dialog]]:h-full [&_[data-slot=dialog]]:min-h-0 [&_[data-slot=dialog]]:grid-rows-[auto_minmax(0,1fr)] [&_[data-slot=dialog]]:gap-0" overlayClassName="z-50 bg-black/45 backdrop-blur-sm">
      <DialogHeader className="flex-row items-center justify-between border-b bg-muted/20 px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-4" aria-hidden="true" /></span><div><DialogTitle>{t("assistant")}</DialogTitle><p className="mt-0.5 text-xs text-muted-foreground">{t("askGovernmentService")}</p></div></div><Button variant="ghost" size="icon-sm" onPress={() => setOpen(false)} aria-label={t("closeAssistant")}><X aria-hidden="true" /></Button></DialogHeader>
      <div className="flex h-full min-h-0 flex-col overflow-hidden"><div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite"><div className="mx-auto w-full max-w-5xl space-y-7">{isEmpty ? <div className="flex min-h-[min(46vh,420px)] flex-col items-center justify-center px-4 text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-6" aria-hidden="true" /></span><h3 className="mt-5 text-xl font-semibold">{t("governmentServicesAssistant")}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t("assistantEntryDescription")}</p><div className="mt-6 flex flex-wrap justify-center gap-2">{[t("assistantPromptIncome"), t("assistantPromptEligibility"), t("assistantPromptKisan"), t("assistantPromptTrack")].map((prompt) => <Button key={prompt} size="sm" variant="outline" className="rounded-full" onPress={() => send(prompt)}>{prompt}</Button>)}</div></div> : messages.map((message) => message.role === "user" ? <div key={message.id} className="ml-auto w-fit max-w-[72%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground shadow-sm">{message.content}</div> : <article key={message.id} className="max-w-5xl"><div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Sparkles className="size-3.5 text-primary" aria-hidden="true" />{t("assistant")}</div><p className="mt-2 max-w-2xl text-sm leading-6 text-foreground">{message.content}</p>{message.components ? <MessageComponents components={message.components} applyingServiceId={applyingServiceId} reviewedApplications={reviewedApplications} onApply={apply} onDocumentAttached={documentAttached} onReview={(applicationId) => setReviewedApplications((current) => new Set(current).add(applicationId))} onConsentGranted={consentGranted} onConsentRejected={consentRejected} onPaid={paymentCompleted} onSubmitted={submissionCompleted} onSave={saveQuestion} /> : null}</article>)}{busy || applyingServiceId ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="assistant-thinking-dots" aria-hidden="true"><i /><i /><i /></span>{applyingServiceId ? t("startingApplication") : t("chatThinking")}</p> : null}{error ? <p role="alert" className="text-sm text-destructive">{t("chatError")}</p> : null}<div ref={bottomRef} /></div></div>
        <form className="border-t bg-background/95 px-4 py-3 supports-backdrop-filter:bg-background/80 sm:px-6" onSubmit={(event) => { event.preventDefault(); send(); }}><div className="assistant-modal-composer mx-auto flex w-full max-w-5xl items-end gap-2"><label className="sr-only" htmlFor="citizen-assistant-input">{t("askGovernmentService")}</label><Sparkles className="mb-3 ml-1 size-4 shrink-0 text-primary/80" aria-hidden="true" /><Textarea id="citizen-assistant-input" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={t("askGovernmentService")} rows={2} className="min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={busy} /><Button type="submit" size="icon" className="mb-0.5 shrink-0 rounded-full" isDisabled={busy || !draft.trim()} aria-label={t("send")}><Send aria-hidden="true" /></Button></div></form>
      </div>
    </Dialog> : null}
  </>;
}
