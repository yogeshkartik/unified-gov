import type { ReactNode } from "react";
import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading data…" }: { label?: string }) {
  return <div className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{label}</div>;
}

export function ErrorState({ children = "We could not load this information. Please try again." }: { children?: ReactNode }) {
  return <div role="alert" className="flex min-h-32 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" aria-hidden="true" />{children}</div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground"><Inbox className="size-5" aria-hidden="true" />{children}</div>;
}
