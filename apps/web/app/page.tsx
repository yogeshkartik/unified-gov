"use client";

import { ArrowRight, CheckCircle2, Search, UserRound } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { LogoutNotice } from "@/components/layout/logout-notice";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export default function Home() {
  const { t } = useCitizenPreferences();
  const steps = [
    { icon: UserRound, label: t("saveYourDetails") },
    { icon: Search, label: t("chooseService") },
    { icon: CheckCircle2, label: t("reviewSubmit") },
  ];
  return (
    <div className="min-h-screen">
      <LogoutNotice />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <header className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">UG</span>
          {t("appName")}
        </header>

        <section className="max-w-3xl py-14 sm:py-20">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("landingEyebrow")}</h1>
          <p className="mt-5 text-lg text-muted-foreground">{t("landingDescription")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/services" size="lg">{t("exploreServices")} <ArrowRight aria-hidden="true" /></LinkButton>
            <LinkButton href="/login" variant="outline" size="lg">{t("citizenSignIn")}</LinkButton>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{t("sharingControl")}</p>
        </section>

        <section className="max-w-4xl border-t pt-8" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="text-lg font-semibold">{t("howItWorks")}</h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-8">
            {steps.map(({ icon: Icon, label }, index) => (
              <li key={label} className="flex items-center gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index + 1}</span>
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
