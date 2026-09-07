"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceField } from "@/src/types";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export type DynamicFormValues = Record<string, string | boolean | undefined>;

interface DynamicFieldProps {
  field: ServiceField;
  control: Control<DynamicFormValues>;
  errors: FieldErrors<DynamicFormValues>;
  register: UseFormRegister<DynamicFormValues>;
}

export function DynamicField({ field, control, errors, register }: DynamicFieldProps) {
  const { t } = useCitizenPreferences();
  const error = errors[field.key]?.message;
  const errorId = `${field.id}-error`;
  const describedBy = error ? errorId : undefined;
  const options = field.options ?? [];
  const label = <Label id={`${field.id}-label`} htmlFor={field.id}>{field.label}{field.required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}</Label>;

  let controlElement: React.ReactNode;
  if (options.length > 0) {
    controlElement = <Controller control={control} name={field.key} render={({ field: formField }) => <Select className="w-full" selectedKey={typeof formField.value === "string" && options.includes(formField.value) ? formField.value : null} onSelectionChange={(key) => formField.onChange(String(key))} aria-label={field.label} isInvalid={Boolean(error)}><SelectTrigger><SelectValue>{field.label}</SelectValue></SelectTrigger><SelectContent>{options.map((option) => <SelectItem id={option} key={option}>{field.option_labels?.[option] ?? option}</SelectItem>)}</SelectContent></Select>} />;
  } else switch (field.field_type) {
    case "textarea":
      controlElement = <Textarea id={field.id} aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key)} />;
      break;
    case "number":
      controlElement = <Input id={field.id} type="text" inputMode="decimal" aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key)} />;
      break;
    case "date":
      controlElement = <Input id={field.id} type="date" aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key)} />;
      break;
    case "checkbox":
      controlElement = <Controller control={control} name={field.key} render={({ field: formField }) => <RadioGroup aria-labelledby={`${field.id}-label`} aria-describedby={describedBy} isInvalid={Boolean(error)} value={typeof formField.value === "boolean" ? String(formField.value) : undefined} onChange={(value) => formField.onChange(value === "true")} className="grid grid-cols-2 gap-3 sm:max-w-xs"><Label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3"><RadioGroupItem value="true" />{t("yes")}</Label><Label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3"><RadioGroupItem value="false" />{t("no")}</Label></RadioGroup>} />;
      break;
    default:
      controlElement = <Input id={field.id} type="text" aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key)} />;
  }

  return <div className="space-y-2">{label}{controlElement}{field.help_text ? <p className="text-xs text-muted-foreground">{field.help_text}</p> : null}{error ? <p id={errorId} role="alert" className="text-sm text-destructive">{String(error)}</p> : null}</div>;
}
