import { ArrowRight, Landmark, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return <div className="min-h-screen"><main className="mx-auto flex min-h-screen max-w-md items-center p-4"><Card className="w-full border-t-4 border-t-primary"><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm"><Landmark className="size-5" aria-hidden="true" /></div><CardTitle>Citizen access</CardTitle><p className="text-sm leading-6 text-muted-foreground">Continue to your unified services account.</p></CardHeader><CardContent className="space-y-6"><div className="flex gap-3 rounded-lg bg-blue-50 p-4"><UserRound className="mt-0.5 size-5 text-primary" aria-hidden="true" /><div><p className="font-medium">Rahul Kumar</p><p className="text-sm text-muted-foreground">rahul.kumar@example.com</p></div></div><LinkButton href="/dashboard" size="lg" className="w-full">Continue <ArrowRight aria-hidden="true" /></LinkButton></CardContent></Card></main></div>;
}
