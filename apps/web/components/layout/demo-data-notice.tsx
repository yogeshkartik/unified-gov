"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoDataNotice() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const dismissTimer = window.setTimeout(() => setLeaving(true), 4000);
    const removeTimer = window.setTimeout(() => setVisible(false), 4200);
    return () => {
      window.clearTimeout(dismissTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950 shadow-lg transition-all duration-200 motion-reduce:transition-none ${leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`} role="status">
      <Info className="size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>Demo account · Synthetic data only</span>
      <Button type="button" variant="ghost" size="icon-xs" className="-mr-1 text-blue-800" aria-label="Dismiss demo data notice" onPress={() => setLeaving(true)}>
        <X aria-hidden="true" />
      </Button>
    </div>
  );
}
