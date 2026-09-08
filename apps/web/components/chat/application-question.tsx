"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { localizeServiceFieldLabel, localizeServiceOption } from "@/src/i18n/service-localization";
import type { ApplicationQuestion } from "@/src/types";
import { ApiError } from "@/src/lib/api";

export function ApplicationQuestionCard({ question, onSave }: { question: ApplicationQuestion; onSave: (question: ApplicationQuestion, value: unknown, displayValue: string) => Promise<void> }) {
  const { language, t } = useCitizenPreferences();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const label = localizeServiceFieldLabel(question.field.key, question.field.label, language);
  const errorId = `${question.application_id}-${question.field.key}-error`;

  async function save(canonicalValue: unknown, displayValue: string) {
    if (saving || saved) return;
    setSaving(true); setError(undefined);
    try { await onSave(question, canonicalValue, displayValue); setSaved(true); }
    catch (cause) {
      const unavailableCodes = new Set(["APPLICATION_NOT_FOUND", "APPLICATION_NOT_EDITABLE", "FIELD_NOT_FOUND", "FIELD_NOT_APPLICABLE"]);
      setError(cause instanceof ApiError && unavailableCodes.has(cause.detail?.code ?? "") ? t("applicationUnavailable") : t("validValueError"));
    }
    finally { setSaving(false); }
  }

  function submitInput() {
    if (question.type === "NUMBER_QUESTION") {
      const number = Number(value);
      if (!value.trim() || !Number.isFinite(number)) { setError(t("validValueError")); return; }
      void save(number, value.trim()); return;
    }
    void save(value, value.trim());
  }

  const status = saved ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="size-3.5" aria-hidden="true" />{t("answerSaved")}</p> : null;
  const errorMessage = error ? <p id={errorId} role="alert" className="mt-2 text-xs text-destructive">{error}</p> : null;
  const options = question.field.options ?? [];

  let control: React.ReactNode;
  if (question.type === "BOOLEAN_QUESTION") {
    control = <div role="group" aria-labelledby={`${errorId}-label`} className="mt-3 grid grid-cols-2 gap-2"><Button variant="outline" onPress={() => save(true, t("yes"))} isDisabled={saving || saved}>{t("yes")}</Button><Button variant="outline" onPress={() => save(false, t("no"))} isDisabled={saving || saved}>{t("no")}</Button></div>;
  } else if (question.type === "SELECT_QUESTION" && options.length <= 6) {
    control = <div role="group" aria-labelledby={`${errorId}-label`} className="mt-3 flex flex-wrap gap-2">{options.map((option) => <Button key={option} variant="outline" size="sm" onPress={() => save(option, localizeServiceOption(option, language))} isDisabled={saving || saved}>{localizeServiceOption(option, language)}</Button>)}</div>;
  } else if (question.type === "SELECT_QUESTION") {
    control = <form className="mt-3 flex items-end gap-2" onSubmit={(event) => { event.preventDefault(); void save(value, localizeServiceOption(value, language)); }}><Select className="min-w-0 flex-1" selectedKey={value || null} onSelectionChange={(key) => setValue(String(key))} aria-label={label} isDisabled={saving || saved} isInvalid={Boolean(error)}><SelectTrigger><SelectValue>{t("selectOption")}</SelectValue></SelectTrigger><SelectContent>{options.map((option) => <SelectItem id={option} key={option}>{localizeServiceOption(option, language)}</SelectItem>)}</SelectContent></Select><Button type="submit" size="sm" isDisabled={saving || saved || !value}>{saving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{t("saveAnswer")}</Button></form>;
  } else {
    const textarea = question.type === "TEXTAREA_QUESTION";
    control = <form className="mt-3 space-y-2" onSubmit={(event) => { event.preventDefault(); submitInput(); }}>{textarea ? <Textarea value={value} onChange={(event) => setValue(event.target.value)} aria-labelledby={`${errorId}-label`} aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)} disabled={saving || saved} /> : <Input type={question.type === "NUMBER_QUESTION" ? "number" : "text"} inputMode={question.type === "NUMBER_QUESTION" ? "decimal" : undefined} value={value} onChange={(event) => setValue(event.target.value)} aria-labelledby={`${errorId}-label`} aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)} disabled={saving || saved} />}<Button type="submit" size="sm" isDisabled={saving || saved}>{saving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{t("saveAnswer")}</Button></form>;
  }

  return <section className="mt-3 max-w-2xl overflow-hidden rounded-xl border bg-card p-4 text-foreground" aria-labelledby={`${errorId}-label`}><p id={`${errorId}-label`} className="font-semibold">{label}{question.field.required ? <span className="ml-1 text-destructive" aria-label={t("required")}>*</span> : null}</p>{question.field.help_text ? <p className="mt-1 text-xs text-muted-foreground">{question.field.help_text}</p> : null}{control}{saving ? <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />{t("savingAnswer")}</p> : null}{status}{errorMessage}</section>;
}
