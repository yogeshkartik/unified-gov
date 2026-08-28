"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ApplicationFlowDirection, flowDirectionKey } from "@/components/application/application-flow-navigation";

interface ApplicationFlowShellProps {
  serviceName: string;
  step: 1 | 2 | 3 | 4 | 5;
  stepName: string;
  applicationId?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose?: () => void;
}

export function ApplicationFlowShell({
  serviceName,
  step,
  stepName,
  applicationId,
  children,
  footer,
  onClose,
}: ApplicationFlowShellProps) {
  const router = useRouter();
  const [direction] = useState<ApplicationFlowDirection>(() => {
    if (!applicationId || typeof window === "undefined") return "forward";
    return (window.sessionStorage.getItem(flowDirectionKey(applicationId)) as ApplicationFlowDirection | null) ?? "forward";
  });

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    router.push("/applications");
  }, [onClose, router]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const progressPercent = Math.min(100, Math.max(0, (step / 5) * 100));

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm duration-150 animate-in fade-in-0 motion-reduce:animate-none"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flow-service-title"
        className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-xl bg-card text-card-foreground shadow-2xl border border-border overflow-hidden"
      >
        {/* Sticky/Fixed Header */}
        <header className="border-b px-6 py-4 sm:px-7 sm:py-5 bg-card shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2
                id="flow-service-title"
                className="text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate"
              >
                {serviceName}
              </h2>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-muted-foreground">
                Step {step} of 5 · {stepName}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full shrink-0 -mr-1.5 text-muted-foreground hover:text-foreground"
              onPress={handleClose}
              aria-label="Close and return to applications"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Thin Compact Progress Bar */}
          <div
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={5}
            aria-label={`Step ${step} of 5: ${stepName}`}
            className="mt-3.5 h-1 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full bg-primary transition-all duration-300 ease-out motion-reduce:transition-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </header>

        {/* Scrollable Form / Content Body */}
        <main className={`overflow-x-hidden overflow-y-auto px-6 py-6 sm:px-8 space-y-6 flex-1 min-h-0 animate-in fade-in-0 duration-200 ease-out motion-reduce:animate-none ${direction === "back" ? "slide-in-from-left-4" : "slide-in-from-right-4"}`}>
          {children}
        </main>

        {/* Sticky/Fixed Footer */}
        {footer ? (
          <footer className="border-t bg-muted/40 px-6 py-4 sm:px-8 shrink-0">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
