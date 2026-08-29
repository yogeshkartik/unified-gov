"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { LinkButton } from "@/components/ui/button";
import { LogoutNotice } from "@/components/layout/logout-notice";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";
import { ServiceOrbitAnimation } from "@/components/landing/service-orbit-animation";
import { HowItWorksJourney } from "@/components/landing/how-it-works-journey";

export default function Home() {
  const { t } = useCitizenPreferences();
  const reduceMotion = useReducedMotion();
  const entrance = (delay: number) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion ? { duration: 0 } : { duration: 0.42, delay, ease: "easeOut" as const },
  });
  return (
    <div className="min-h-screen">
      <LogoutNotice />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
        <motion.header {...entrance(0)} className="flex items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">UG</span>
          {t("appName")}
        </motion.header>

        <section className="grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.8fr)] lg:gap-12 lg:py-20">
          <div className="max-w-3xl">
            <motion.h1 {...entrance(0.1)} className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("landingEyebrow")}</motion.h1>
            <motion.p {...entrance(0.2)} className="mt-5 text-lg text-muted-foreground">{t("landingDescription")}</motion.p>
            <motion.div {...entrance(0.3)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/services" size="lg">{t("exploreServices")} <ArrowRight aria-hidden="true" /></LinkButton>
              <LinkButton href="/login" variant="outline" size="lg">{t("citizenSignIn")}</LinkButton>
            </motion.div>
            <motion.p {...entrance(0.4)} className="mt-6 text-sm text-muted-foreground">{t("sharingControl")}</motion.p>
          </div>
          <ServiceOrbitAnimation />
        </section>

        <HowItWorksJourney />
      </main>
    </div>
  );
}
