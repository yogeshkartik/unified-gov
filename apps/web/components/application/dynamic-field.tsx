"use client";

import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceField } from "@/src/types";

export type DynamicFormValues = Record<string, string | number | boolean | undefined>;

interface DynamicFieldProps {
  field: ServiceField;
  control: Control<DynamicFormValues>;
  errors: FieldErrors<DynamicFormValues>;
  register: UseFormRegister<DynamicFormValues>;
}

export function DynamicField({ field, control, errors, register }: DynamicFieldProps) {
  const error = errors[field.key]?.message;
  const errorId = `${field.id}-error`;
  const describedBy = error ? errorId : undefined;
  const options = field.options ?? [];
  const label = <Label htmlFor={field.id}>{field.label}{field.required ? <span className="ml-1 text-destructive" aria-hidden="true">*</span> : null}</Label>;

  let controlElement: React.ReactNode;
  switch (field.field_type) {
    case "TEXTAREA":
      controlElement = <Textarea id={field.id} aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key)} />;
      break;
    case "NUMBER":
      controlElement = <Input id={field.id} type="number" inputMode="decimal" aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key, { valueAsNumber: true })} />;
      break;
    case "DATE":
      controlElement = <Input id={field.id} type="date" aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key)} />;
      break;
    case "SELECT":
      controlElement = <Controller control={control} name={field.key} render={({ field: formField }) => <Select selectedKey={typeof formField.value === "string" ? formField.value : null} onSelectionChange={(key) => formField.onChange(String(key))} aria-label={field.label} isInvalid={Boolean(error)}><SelectTrigger><SelectValue>{field.label}</SelectValue></SelectTrigger><SelectContent>{options.map((option) => <SelectItem id={option} key={option}>{option}</SelectItem>)}</SelectContent></Select>} />;
      break;
    case "RADIO":
      controlElement = <Controller control={control} name={field.key} render={({ field: formField }) => <RadioGroup value={typeof formField.value === "string" ? formField.value : undefined} onChange={formField.onChange} aria-label={field.label} isInvalid={Boolean(error)}>{options.map((option) => <label key={option} className="flex min-h-10 items-center gap-3 rounded-lg border border-border px-3 text-sm"><RadioGroupItem value={option} />{option}</label>)}</RadioGroup>} />;
      break;
    case "CHECKBOX":
      controlElement = <Controller control={control} name={field.key} render={({ field: formField }) => <label className="flex min-h-10 items-center gap-3 text-sm"><Checkbox isSelected={formField.value === true} onChange={formField.onChange} aria-describedby={describedBy} isInvalid={Boolean(error)} />{field.label}</label>} />;
      break;
    default:
      controlElement = <Input id={field.id} type="text" aria-describedby={describedBy} aria-invalid={Boolean(error)} {...register(field.key)} />;
  }

  return <div className="space-y-2">{field.field_type === "CHECKBOX" ? null : label}{controlElement}{field.help_text ? <p className="text-xs text-muted-foreground">{field.help_text}</p> : null}{error ? <p id={errorId} role="alert" className="text-sm text-destructive">{String(error)}</p> : null}</div>;
}
