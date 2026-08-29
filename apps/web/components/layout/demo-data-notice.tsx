"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function DemoDataNotice() {
  const { t } = useCitizenPreferences();
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
    <div className={`overflow-hidden transition-[max-height,opacity] duration-200 ease-out motion-reduce:transition-none ${leaving ? "max-h-0 opacity-0" : "max-h-16 opacity-100"}`}>
      <div className={`mx-auto w-full max-w-7xl px-4 pt-3 transition-transform duration-200 motion-reduce:transition-none sm:px-6 lg:px-8 ${leaving ? "-translate-y-1" : "translate-y-0"}`}>
        <div className="flex min-h-10 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 shadow-sm" role="status">
          <Info className="size-4 shrink-0 text-amber-700" aria-hidden="true" />
          <span>{t("demoNotice")}</span>
          <Button type="button" variant="ghost" size="icon-xs" className="-mr-1 ml-auto text-amber-800" aria-label={t("dismissDemoNotice")} onPress={() => setLeaving(true)}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
