import { CalendarDays, Landmark, IndianRupee } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GovernmentService } from "@/src/types";

export function ServiceCard({ service }: { service: GovernmentService }) {
  const deadline = service.end_date ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(service.end_date)) : "Not specified";
  const fee = service.fee > 0 ? `${service.currency} ${service.fee}` : "Free";
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3"><CardTitle>{service.name}</CardTitle><Badge variant="secondary">{service.category}</Badge></div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Landmark className="size-3.5" aria-hidden="true" />{service.department}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{service.description}</p>
        <dl className="grid grid-cols-2 gap-3 text-xs"><div><dt className="flex items-center gap-1 text-muted-foreground"><CalendarDays className="size-3" aria-hidden="true" />Deadline</dt><dd className="mt-1 font-medium text-foreground">{deadline}</dd></div><div><dt className="flex items-center gap-1 text-muted-foreground"><IndianRupee className="size-3" aria-hidden="true" />Fee</dt><dd className="mt-1 font-medium text-foreground">{fee}</dd></div></dl>
      </CardContent>
      <CardFooter><Button variant="outline" className="w-full" isDisabled>Service details coming next</Button></CardFooter>
    </Card>
  );
}
