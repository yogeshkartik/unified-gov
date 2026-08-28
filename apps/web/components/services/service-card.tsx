import { Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import type { GovernmentService } from "@/src/types";

export function ServiceCard({ service }: { service: GovernmentService }) {
  const deadline = service.end_date ? `Apply by ${new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(service.end_date))}` : "No deadline";
  const fee = service.fee > 0 ? new Intl.NumberFormat("en-IN", { style: "currency", currency: service.currency, maximumFractionDigits: 0 }).format(service.fee) : "Free";
  return (
    <Card className="h-full transition-[transform,box-shadow,ring-color] duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/20">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3"><CardTitle>{service.name}</CardTitle><Badge variant="secondary">{service.category}</Badge></div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Landmark className="size-3.5" aria-hidden="true" />{service.department}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
        <p className="mt-4 text-sm font-medium text-muted-foreground"><span>{fee}</span><span className="mx-2" aria-hidden="true">•</span><span>{deadline}</span></p>
        <LinkButton href={`/services/${service.id}`} variant="link" size="sm" className="mt-4 h-auto w-fit px-0">View details <span aria-hidden="true">→</span></LinkButton>
      </CardContent>
    </Card>
  );
}
