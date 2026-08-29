import { Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import type { GovernmentService } from "@/src/types";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export function ServiceCard({ service }: { service: GovernmentService }) {
  const { language, t } = useCitizenPreferences();
  const locale = language === "hi" ? "hi-IN" : "en-IN";
  const deadline = service.end_date ? t("applyBy", { date: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(service.end_date)) }) : t("noDeadline");
  const fee = service.fee > 0 ? new Intl.NumberFormat(locale, { style: "currency", currency: service.currency, maximumFractionDigits: 0 }).format(service.fee) : t("free");
  return (
    <Card className="transition-[transform,box-shadow,ring-color] duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/20">
      <CardHeader className="gap-1.5 py-3 sm:px-5">
        <div className="flex items-start justify-between gap-3"><CardTitle>{service.name}</CardTitle><Badge variant="secondary">{service.category}</Badge></div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Landmark className="size-3.5" aria-hidden="true" />{service.department}</p>
      </CardHeader>
      <CardContent className="flex flex-col pb-3 sm:px-5">
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2"><p className="text-sm font-medium text-muted-foreground"><span>{fee}</span><span className="mx-2" aria-hidden="true">•</span><span>{deadline}</span></p><LinkButton href={`/services/${service.id}`} variant="link" size="sm" className="h-auto w-fit px-0">{t("viewDetails")} <span aria-hidden="true">→</span></LinkButton></div>
      </CardContent>
    </Card>
  );
}
