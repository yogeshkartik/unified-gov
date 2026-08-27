"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DynamicField, type DynamicFormValues } from "@/components/application/dynamic-field";
import type { ServiceField } from "@/src/types";

function fieldSchema(field: ServiceField) {
  if (field.field_type === "CHECKBOX") return z.boolean().refine((value) => !field.required || value, "Please confirm this item.");
  if (field.field_type === "NUMBER") return field.required ? z.number().finite("Enter a valid number.") : z.number().finite("Enter a valid number.").optional();
  if ((field.options?.length ?? 0) > 0) {
    const allowedValues = field.options ?? [];
    const selection = z.string().trim().refine(
      (value) => value.length === 0 || allowedValues.length === 0 || allowedValues.includes(value),
      `Choose a valid ${field.label.toLowerCase()} option.`,
    );
    return field.required
      ? selection.refine((value) => value.length > 0, `${field.label} is required.`)
      : selection.optional();
  }
  const required = z.string().trim().min(1, `${field.label} is required.`);
  return field.required ? required : z.string().optional();
}

function formSchema(fields: ServiceField[]) {
  return z.object(Object.fromEntries(fields.map((field) => [field.key, fieldSchema(field)])));
}

interface DynamicFormProps {
  fields: ServiceField[];
  defaultValues: DynamicFormValues;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: DynamicFormValues) => Promise<void>;
}

export function DynamicForm({ fields, defaultValues, isSubmitting, submitLabel = "Save and continue", onSubmit }: DynamicFormProps) {
  const form = useForm<DynamicFormValues>({ resolver: zodResolver(formSchema(fields)), defaultValues });
  return <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>{fields.sort((a, b) => a.position - b.position).map((field) => <DynamicField key={field.id} field={field} control={form.control} register={form.register} errors={form.formState.errors} />)}<Button type="submit" size="lg" isDisabled={isSubmitting}>{isSubmitting ? "Saving…" : submitLabel}</Button></form>;
}
