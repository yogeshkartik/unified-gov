"use client";

import { Award, Car, FileCheck2, FileText, GraduationCap, Landmark, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

type ServiceNode = {
  id: string;
  icon: LucideIcon;
  position: { x: number; y: number };
  label: { en: string; hi: string };
};

const center = { x: 200, y: 185 };
const nodes: ServiceNode[] = [
  { id: "exam", icon: GraduationCap, position: { x: 200, y: 45 }, label: { en: "JEE Main", hi: "JEE मेन" } },
  { id: "passport", icon: FileText, position: { x: 74, y: 104 }, label: { en: "Passport", hi: "पासपोर्ट" } },
  { id: "licence", icon: Car, position: { x: 326, y: 104 }, label: { en: "Driving licence", hi: "ड्राइविंग लाइसेंस" } },
  { id: "scheme", icon: Landmark, position: { x: 74, y: 267 }, label: { en: "PM-KISAN", hi: "PM-KISAN" } },
  { id: "certificate", icon: FileCheck2, position: { x: 326, y: 267 }, label: { en: "Certificate", hi: "प्रमाण पत्र" } },
  { id: "scholarship", icon: Award, position: { x: 200, y: 327 }, label: { en: "Scholarship", hi: "छात्रवृत्ति" } },
];

function connectionPath({ x, y }: ServiceNode["position"]) {
  const midpointX = (center.x + x) / 2;
  const midpointY = (center.y + y) / 2;
  const curve = x === center.x ? 0 : (y < center.y ? -16 : 16);
  return `M ${center.x} ${center.y} Q ${midpointX} ${midpointY + curve} ${x} ${y}`;
}

export function ServiceOrbitAnimation() {
  const { language, t } = useCitizenPreferences();
  const reduceMotion = useReducedMotion();

  return (
    <figure className="relative mx-auto w-full max-w-[29rem] select-none" aria-labelledby="service-orbit-title">
      <figcaption id="service-orbit-title" className="sr-only">
        {language === "hi"
          ? "एक नागरिक प्रोफ़ाइल कई सरकारी सेवाओं में जानकारी का पुन: उपयोग करती है।"
          : "One citizen profile securely reuses information across many government services."}
      </figcaption>
      <div className="relative aspect-[10/9] min-h-[19rem] overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-background to-sky-50/70 p-3 shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.10),transparent_42%)]" />
        <svg viewBox="0 0 400 360" className="absolute inset-0 size-full" aria-hidden="true">
          <defs>
            <linearGradient id="service-orbit-line" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <g className="text-primary">
            {nodes.map((node, index) => {
              const path = connectionPath(node.position);
              return (
                <g key={node.id}>
                  <motion.path
                    d={path}
                    fill="none"
                    stroke="url(#service-orbit-line)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.3 + index * 0.1, ease: "easeOut" }}
                  />
                  {!reduceMotion ? (
                    <motion.circle
                      r="3.25"
                      fill="currentColor"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 0.85, 0],
                        cx: [center.x, node.position.x],
                        cy: [center.y, node.position.y],
                      }}
                      transition={{ duration: 2.8, delay: 1.3 + index * 0.22, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
                    />
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>

        {nodes.map((node, index) => {
          const Icon = node.icon;
          return (
            <motion.div
              key={node.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(node.position.x / 400) * 100}%`, top: `${(node.position.y / 360) * 100}%` }}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.86, y: 5 }}
              animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: [0, index % 2 ? -2 : 2, 0] }}
              transition={{ opacity: { duration: 0.35, delay: 0.15 + index * 0.1 }, scale: { duration: 0.35, delay: 0.15 + index * 0.1 }, y: { duration: 4 + index * 0.2, delay: 0.8 + index * 0.1, repeat: Infinity, ease: "easeInOut" } }}
            >
              <div className="flex w-[5.5rem] flex-col items-center gap-1.5 rounded-xl border border-primary/15 bg-background/90 px-2 py-2 text-center shadow-sm backdrop-blur-sm sm:w-[6.25rem]">
                <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-3.5" aria-hidden="true" /></span>
                <span className="text-[10px] font-medium leading-tight text-foreground sm:text-xs">{node.label[language]}</span>
              </div>
            </motion.div>
          );
        })}

        <motion.div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(center.x / 400) * 100}%`, top: `${(center.y / 360) * 100}%` }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="grid size-[5.7rem] place-items-center rounded-full border-4 border-background bg-primary text-center text-primary-foreground shadow-lg shadow-primary/20 sm:size-24">
            <div className="flex flex-col items-center gap-0.5"><UserRound className="size-5" aria-hidden="true" /><span className="text-[11px] font-semibold">{t("profile")}</span></div>
          </div>
        </motion.div>
      </div>
    </figure>
  );
}
