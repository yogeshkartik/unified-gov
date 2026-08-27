import { ArrowRight, FlaskConical, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrototypeBanner } from "@/components/layout/prototype-banner";

export default function LoginPage() {
  return <div className="min-h-screen bg-muted/30"><PrototypeBanner /><main className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-md items-center p-4"><Card className="w-full"><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground"><FlaskConical className="size-5" aria-hidden="true" /></div><CardTitle>Demo citizen access</CardTitle><p className="text-sm leading-6 text-muted-foreground">No password or identity verification is used in this synthetic prototype.</p></CardHeader><CardContent className="space-y-6"><div className="flex gap-3 rounded-lg bg-muted p-4"><UserRound className="mt-0.5 size-5 text-primary" aria-hidden="true" /><div><p className="font-medium">Demo Citizen</p><p className="text-sm text-muted-foreground">Rahul Kumar</p><p className="text-sm text-muted-foreground">rahul.demo@example.com</p></div></div><LinkButton href="/dashboard" size="lg" className="w-full">Continue as Demo Citizen <ArrowRight aria-hidden="true" /></LinkButton></CardContent></Card></main></div>;
}
