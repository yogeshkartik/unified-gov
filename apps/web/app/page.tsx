import { ArrowRight, CheckCircle2, FileStack, Languages, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { icon: FileStack, text: "One reusable citizen profile" },
  { icon: ShieldCheck, text: "Explicit consent before sharing" },
  { icon: CheckCircle2, text: "Only additional service information when needed" },
  { icon: Languages, text: "Accessible and multilingual-ready" },
];

export default function Home() {
  return <div className="min-h-screen"><main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20"><header className="flex items-center gap-3 font-semibold"><span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm">UG</span>Unified Government Services</header><section className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center"><div><p className="text-sm font-medium text-primary">One profile. Many services.</p><h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Apply for public services without repeatedly entering the same information.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Your citizen profile, education records and documents are reused only when you provide clear consent.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><LinkButton href="/services" size="lg">Explore services <ArrowRight aria-hidden="true" /></LinkButton><LinkButton href="/login" variant="outline" size="lg">Citizen sign in</LinkButton></div></div><Card className="border-t-4 border-t-amber-500 bg-gradient-to-br from-amber-50/80 to-card"><CardContent className="space-y-5 pt-4"><p className="text-sm font-medium">Designed for a simpler journey</p>{features.map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3"><Icon className="size-5 text-primary" aria-hidden="true" /><span className="text-sm">{text}</span></div>)}</CardContent></Card></section></main></div>;
}
