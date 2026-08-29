"use client";

import { ArrowRight, CheckCircle2, FileCheck2, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

type JourneyStep = { icon: LucideIcon; title: "journeyProfileTitle" | "journeyServiceTitle" | "journeySubmitTitle"; description: "journeyProfileDescription" | "journeyServiceDescription" | "journeySubmitDescription" };

const steps: JourneyStep[] = [
  { icon: UserRound, title: "journeyProfileTitle", description: "journeyProfileDescription" },
  { icon: FileCheck2, title: "journeyServiceTitle", description: "journeyServiceDescription" },
  { icon: CheckCircle2, title: "journeySubmitTitle", description: "journeySubmitDescription" },
];

function JourneyStepContent({ step, index }: { step: JourneyStep; index: number }) {
  const { t } = useCitizenPreferences();
  const Icon = step.icon;
  return (
    <div className="flex min-w-0 gap-3 sm:block sm:text-center">
      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:gap-2">
        <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground shadow-sm">{index + 1}</span>
        <Icon className="size-4 text-primary sm:size-5" aria-hidden="true" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{t(step.title)}</h3>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{t(step.description)}</p>
      </div>
    </div>
  );
}

export function HowItWorksJourney() {
  const reduceMotion = useReducedMotion();
  const { t } = useCitizenPreferences();
  return (
    <section className="max-w-4xl border-t pt-8" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="text-lg font-semibold">{t("howItWorks")}</h2>

      <ol className="mt-5 hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 sm:grid lg:gap-5">
        {steps.flatMap((step, index) => [
          <motion.li
            key={step.title}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.48, ease: "easeOut" }}
            className="min-w-0"
          >
            <JourneyStepContent step={step} index={index} />
          </motion.li>,
          index < steps.length - 1 ? (
            <motion.li
              key={`${step.title}-connector`}
              aria-hidden="true"
              initial={reduceMotion ? false : { opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.38, delay: 0.3 + index * 0.48, ease: "easeOut" }}
              className="mt-3 flex origin-left items-center text-primary/45"
            >
              <span className="h-px w-5 bg-current lg:w-10" /><ArrowRight className="-ml-0.5 size-4" />
            </motion.li>
          ) : null,
        ])}
      </ol>

      <ol className="mt-5 space-y-4 sm:hidden">
        {steps.map((step, index) => (
          <li key={step.title} className="relative">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.48, ease: "easeOut" }}
            >
              <JourneyStepContent step={step} index={index} />
            </motion.div>
            {index < steps.length - 1 ? (
              <motion.span
                aria-hidden="true"
                initial={reduceMotion ? false : { opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.38, delay: 0.3 + index * 0.48, ease: "easeOut" }}
                className="absolute left-[13px] top-8 h-7 w-px origin-top bg-primary/40"
              />
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
