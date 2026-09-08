"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, CheckCircle2, LoaderCircle, Send, X } from "lucide-react";
import { api } from "@/src/lib/api";
import type { ApplicationProgress, ChatComponent, ChatServiceCard } from "@/src/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localeFor } from "@/src/i18n/locale-format";

type Message = { id: string; role: "user" | "assistant"; content: string; components?: ChatComponent[] };

function ServiceCard({ service, applying, onApply }: { service: ChatServiceCard; applying: boolean; onApply: (service: ChatServiceCard) => void }) {
  const { language, t } = useCitizenPreferences();
  const fee = service.fee > 0 ? new Intl.NumberFormat(localeFor(language), { style: "currency", currency: service.currency, maximumFractionDigits: 0 }).format(service.fee) : t("free");
  return <article className="mt-2 rounded-lg border bg-card p-3 text-foreground"><p className="font-semibold">{service.name}</p><p className="mt-1 text-xs text-muted-foreground">{service.department} · {service.category}</p><p className="mt-2 text-sm text-muted-foreground">{service.description}</p><p className="mt-3 text-sm font-medium">{t("fee", { amount: fee })}</p><div className="mt-3 flex flex-wrap items-center gap-2"><Button size="sm" onPress={() => onApply(service)} isDisabled={applying}>{applying ? <><LoaderCircle className="animate-spin" aria-hidden="true" />{t("startingApplication")}</> : t("applyNow")}</Button><Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/services/${service.service_id}`}>{t("viewDetails")}</Link></div></article>;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages, busy]);
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
    try { const result = await api.startChatApplication(service.service_id); setActiveApplicationId(result.application_id); setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: t(result.result === "CREATED" ? "applicationStartedMessage" : "applicationResumedMessage"), components: [result.progress] }]); }
    catch { setError(true); }
    finally { setApplyingServiceId(undefined); inputRef.current?.focus(); }
  }
  return <>
    <Button className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg sm:right-6 sm:bottom-6" onPress={() => { if (messages.length === 0) setMessages([{ id: "welcome", role: "assistant", content: t("chatWelcome") }]); setOpen(true); }} aria-label={t("openAssistant")}><Bot aria-hidden="true" /> <span className="hidden sm:inline">{t("assistant")}</span></Button>
    {open ? <Dialog isOpen={open} onOpenChange={setOpen} showCloseButton={false} className="fixed top-0 right-0 left-auto h-dvh w-full max-w-[440px] translate-x-0 translate-y-0 gap-0 rounded-none p-0 sm:rounded-l-xl" overlayClassName="z-50">
      <DialogHeader className="flex-row items-center justify-between border-b px-4 py-4"><div className="flex items-center gap-2"><Bot className="size-5 text-primary" aria-hidden="true" /><DialogTitle>{t("assistant")}</DialogTitle></div><Button variant="ghost" size="icon-sm" onPress={() => setOpen(false)} aria-label={t("closeAssistant")}><X aria-hidden="true" /></Button></DialogHeader>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden"><div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">{messages.map((message) => <div key={message.id} className={message.role === "user" ? "ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" : "mr-4 rounded-lg bg-muted px-3 py-2 text-sm"}>{message.content}{message.components?.map((component) => component.type === "SERVICE_CARD" ? <ServiceCard key={`service-${component.service_id}`} service={component} applying={applyingServiceId === component.service_id} onApply={apply} /> : <ApplicationProgressCard key={`application-${component.application_id}`} progress={component} />)}</div>)}{busy || applyingServiceId ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{applyingServiceId ? t("startingApplication") : t("chatThinking")}</p> : null}{error ? <p role="alert" className="text-sm text-destructive">{t("chatError")}</p> : null}<div ref={bottomRef} /></div>
        {messages.length <= 1 ? <div className="flex gap-2 overflow-x-auto px-4 pb-2">{[t("chatPromptIncome"), t("chatPromptKisan")].map((prompt) => <Button key={prompt} size="sm" variant="outline" className="shrink-0" onPress={() => send(prompt)}>{prompt}</Button>)}</div> : null}
        <form className="flex items-end gap-2 border-t p-3" onSubmit={(event) => { event.preventDefault(); send(); }}><label className="sr-only" htmlFor="citizen-assistant-input">{t("askGovernmentService")}</label><Textarea id="citizen-assistant-input" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder={t("askGovernmentService")} rows={2} className="min-h-11 resize-none" disabled={busy} /><Button type="submit" size="icon" isDisabled={busy || !draft.trim()} aria-label={t("send")}><Send aria-hidden="true" /></Button></form>
      </div>
    </Dialog> : null}
  </>;
}
