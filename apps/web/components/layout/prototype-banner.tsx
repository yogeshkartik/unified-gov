import { FlaskConical } from "lucide-react";

export function PrototypeBanner() {
  return (
    <aside className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950" aria-label="Prototype notice">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <FlaskConical className="size-3.5" aria-hidden="true" />
        <span>Demo prototype — not an official government service. All data and integrations are synthetic.</span>
      </div>
    </aside>
  );
}
