"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DynamicField, type DynamicFormValues } from "@/components/application/dynamic-field";
import type { ServiceField } from "@/src/types";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

function fieldSchema(field: ServiceField, validationMessage: string) {
  if (field.field_type === "checkbox")
    return z.boolean().optional().refine((value) => !field.required || value !== undefined, validationMessage);
  if (field.field_type === "number")
    return z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value),
        validationMessage
      )
      .refine((value) => !field.required || value.length > 0, validationMessage);
  if ((field.options?.length ?? 0) > 0) {
    const allowedValues = field.options ?? [];
    const selection = z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || allowedValues.length === 0 || allowedValues.includes(value),
        validationMessage
      );
    return field.required
      ? selection.refine((value) => value.length > 0, validationMessage)
      : selection.optional();
  }
  const required = z.string().trim().min(1, validationMessage);
  return field.required ? required : z.string().optional();
}

function formSchema(fields: ServiceField[], validationMessage: string) {
  return z.object(Object.fromEntries(fields.map((field) => [field.key, fieldSchema(field, validationMessage)])));
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
  submitLabel,
  onBack,
  onSubmit,
}: DynamicFormProps) {
  const { t } = useCitizenPreferences();
  const form = useForm<DynamicFormValues>({ resolver: zodResolver(formSchema(fields, t("completeMissing"))), defaultValues });

  return (
    <form id={id} className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields
          .sort((a, b) => a.position - b.position)
          .map((field) => (
            <div
              key={field.id}
              className={field.field_type === "checkbox" ? "sm:col-span-2" : undefined}
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
            {t("back")}
          </Button>
        ) : (
          <div />
        )}
        <Button type="submit" isDisabled={isSubmitting}>
          {isSubmitting ? t("saving") : submitLabel ?? t("continue")}
        </Button>
      </div>
    </form>
  );
}
