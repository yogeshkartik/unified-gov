"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DynamicField, type DynamicFormValues } from "@/components/application/dynamic-field";
import type { ServiceField } from "@/src/types";

function fieldSchema(field: ServiceField) {
  if (field.field_type === "CHECKBOX")
    return z.boolean().refine((value) => !field.required || value, "Please confirm this item.");
  if (field.field_type === "NUMBER")
    return field.required
      ? z.number().finite("Enter a valid number.")
      : z.number().finite("Enter a valid number.").optional();
  if ((field.options?.length ?? 0) > 0) {
    const allowedValues = field.options ?? [];
    const selection = z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || allowedValues.length === 0 || allowedValues.includes(value),
        `Choose a valid ${field.label.toLowerCase()} option.`
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
  id?: string;
  fields: ServiceField[];
  defaultValues: DynamicFormValues;
  isSubmitting?: boolean;
  submitLabel?: string;
  onBack?: () => void;
  onSubmit: (values: DynamicFormValues) => Promise<void>;
}

export function DynamicForm({
  id,
  fields,
  defaultValues,
  isSubmitting,
  submitLabel = "Continue",
  onBack,
  onSubmit,
}: DynamicFormProps) {
  const form = useForm<DynamicFormValues>({ resolver: zodResolver(formSchema(fields)), defaultValues });

  return (
    <form id={id} className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields
          .sort((a, b) => a.position - b.position)
          .map((field) => (
            <div
              key={field.id}
              className={field.field_type === "CHECKBOX" ? "sm:col-span-2" : undefined}
            >
              <DynamicField
                field={field}
                control={form.control}
                register={form.register}
                errors={form.formState.errors}
              />
            </div>
          ))}
      </div>

      <div className="flex flex-col-reverse gap-3 pt-4 border-t sm:flex-row sm:justify-between sm:items-center">
        {onBack ? (
          <Button type="button" variant="outline" onPress={onBack}>
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button type="submit" isDisabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
