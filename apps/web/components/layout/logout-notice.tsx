"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

const storageKey = "unified-gov-logout-notice";

export function LogoutNotice() {
  const { t } = useCitizenPreferences();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.sessionStorage.getItem(storageKey) !== "true") return;
      window.sessionStorage.removeItem(storageKey);
      setVisible(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [visible]);
  if (!visible) return null;
  return <div role="status" className="fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-950 shadow-xl"><CheckCircle2 className="size-5 shrink-0 text-emerald-600" aria-hidden="true" /><p className="font-medium">{t("logoutSuccess")}</p><button type="button" aria-label={t("dismissNotification")} onClick={() => setVisible(false)} className="rounded p-1 text-emerald-700 hover:bg-emerald-50"><X className="size-4" aria-hidden="true" /></button></div>;
}
