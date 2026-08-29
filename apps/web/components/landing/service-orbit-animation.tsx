"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Award, Car, FileCheck2, FileText, GraduationCap, Landmark, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCitizenPreferences, type Language } from "@/components/providers/citizen-preferences";
import { localizeServiceName } from "@/src/i18n/service-localization";

type Slot = { id: string; position: { x: number; y: number } };
type Service = { id: string; name: string; icon: LucideIcon };
const center = { x: 200, y: 185 };
const slots: Slot[] = [{ id: "top", position: { x: 200, y: 45 } }, { id: "upper-left", position: { x: 74, y: 104 } }, { id: "upper-right", position: { x: 326, y: 104 } }, { id: "lower-left", position: { x: 74, y: 267 } }, { id: "lower-right", position: { x: 326, y: 267 } }, { id: "bottom", position: { x: 200, y: 327 } }];
const serviceSets: Service[][] = [
  [{ id: "JEE_MAIN_001", name: "JEE Main", icon: GraduationCap }, { id: "PASSPORT_001", name: "Passport", icon: FileText }, { id: "DRIVING_LICENCE_001", name: "Driving Licence Application", icon: Car }, { id: "PM_KISAN_001", name: "PM-KISAN", icon: Landmark }, { id: "INCOME_CERTIFICATE_001", name: "Income Certificate", icon: FileCheck2 }, { id: "NATIONAL_SCHOLARSHIP_001", name: "National Scholarship", icon: Award }],
  [{ id: "NEET_UG_001", name: "NEET UG", icon: GraduationCap }, { id: "PAN_CARD_001", name: "PAN Card", icon: FileText }, { id: "VOTER_ID_001", name: "Voter ID", icon: Car }, { id: "AYUSHMAN_BHARAT_001", name: "Ayushman Bharat", icon: Landmark }, { id: "INCOME_CERTIFICATE_001", name: "Income Certificate", icon: FileCheck2 }, { id: "UPSC_CSE_001", name: "UPSC Civil Services Examination", icon: Award }],
  [{ id: "CUET_UG_001", name: "CUET UG", icon: GraduationCap }, { id: "E_SHRAM_001", name: "e-Shram Registration", icon: FileText }, { id: "DOMICILE_CERTIFICATE_001", name: "Domicile Certificate", icon: Car }, { id: "PMAY_001", name: "PMAY", icon: Landmark }, { id: "CASTE_CERTIFICATE_001", name: "Caste Certificate", icon: FileCheck2 }, { id: "SSC_CGL_001", name: "SSC CGL", icon: Award }],
];

function path({ x, y }: Slot["position"]) { return `M ${center.x} ${center.y} Q ${(center.x + x) / 2} ${(center.y + y) / 2 + (x === center.x ? 0 : y < center.y ? -16 : 16)} ${x} ${y}`; }
function label(service: Service, language: Language) { return localizeServiceName(service.id, service.name, language); }

export function ServiceOrbitAnimation() {
  const { language, t } = useCitizenPreferences();
  const reduceMotion = useReducedMotion();
  const [services, setServices] = useState(serviceSets[0]);
  const [setIndex, setSetIndex] = useState(0);
  const [alternateSlots, setAlternateSlots] = useState<number[]>([]);
  const [pulseTarget, setPulseTarget] = useState(0);
  const [receivedTarget, setReceivedTarget] = useState<number>();

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      const nextIndex = (setIndex + 1) % serviceSets.length;
      [[0, 3], [1, 4], [2, 5]].forEach((batch, batchIndex) => window.setTimeout(() => setServices((current) => current.map((service, index) => batch.includes(index) ? serviceSets[nextIndex][index] : service)), batchIndex * 520));
      setSetIndex(nextIndex);
    }, 4300);
    return () => window.clearInterval(interval);
  }, [reduceMotion, setIndex]);
  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => { const picks = [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)]; setAlternateSlots([...new Set(picks)]); window.setTimeout(() => setAlternateSlots([]), 1900); }, 7200);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);
  useEffect(() => {
    if (reduceMotion) return;
    const trigger = () => { const target = Math.floor(Math.random() * 6); setReceivedTarget(undefined); setPulseTarget(target); window.setTimeout(() => setReceivedTarget(target), 1350); };
    trigger(); const interval = window.setInterval(trigger, 3200); return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return <figure className="relative mx-auto w-full max-w-[29rem] select-none" aria-labelledby="service-orbit-title">
    <figcaption id="service-orbit-title" className="sr-only">{language === "hi" ? "एक नागरिक प्रोफ़ाइल कई सरकारी सेवाओं में जानकारी का पुन: उपयोग करती है।" : "One citizen profile securely reuses information across many government services."}</figcaption>
    <div className="relative aspect-[10/9] min-h-[19rem] overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-background to-sky-50/70 p-3 shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.10),transparent_42%)]" />
      <svg viewBox="0 0 400 360" className="absolute inset-0 size-full" aria-hidden="true"><defs><linearGradient id="service-orbit-line" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity="0.55" /><stop offset="100%" stopColor="currentColor" stopOpacity="0.12" /></linearGradient></defs><g className="text-primary">{slots.map((slot, index) => <motion.path key={slot.id} d={path(slot.position)} fill="none" stroke="url(#service-orbit-line)" strokeWidth="1.4" strokeLinecap="round" initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 + index * 0.1, ease: "easeOut" }} />)}{!reduceMotion ? <motion.circle key={pulseTarget} r="3.25" fill="currentColor" animate={{ opacity: [0, 0.85, 0], cx: [center.x, slots[pulseTarget].position.x], cy: [center.y, slots[pulseTarget].position.y] }} transition={{ duration: 1.35, ease: "easeInOut" }} /> : null}</g></svg>
      <motion.div className="absolute inset-0" animate={reduceMotion ? undefined : { rotate: [-1.25, 1.25, -1.25] }} transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}>
        {slots.map((slot, index) => { const service = services[index]; const Icon = service.icon; const labelLanguage = alternateSlots.includes(index) ? language === "en" ? "hi" : "en" : language; return <motion.div key={slot.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${slot.position.x / 4}%`, top: `${slot.position.y / 3.6}%` }} initial={reduceMotion ? false : { opacity: 0, scale: 0.86, y: 5 }} animate={reduceMotion ? undefined : { opacity: 1, scale: 1, y: [0, index % 2 ? -2 : 2, 0] }} transition={{ opacity: { duration: 0.35, delay: 0.15 + index * 0.1 }, scale: { duration: 0.35, delay: 0.15 + index * 0.1 }, y: { duration: 4 + index * 0.2, delay: 0.8 + index * 0.1, repeat: Infinity, ease: "easeInOut" } }}><motion.div animate={receivedTarget === index ? { boxShadow: ["0 1px 2px rgb(15 23 42 / 0.08)", "0 0 0 5px rgb(37 99 235 / 0.16)", "0 1px 2px rgb(15 23 42 / 0.08)"] } : undefined} transition={{ duration: 0.7 }} className="flex w-[5.5rem] flex-col items-center gap-1.5 rounded-xl border border-primary/15 bg-background/90 px-2 py-2 text-center shadow-sm backdrop-blur-sm sm:w-[6.25rem]"><span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-3.5" aria-hidden="true" /></span><AnimatePresence mode="wait" initial={false}><motion.span key={`${service.id}-${labelLanguage}`} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3, ease: "easeOut" }} className="text-[10px] font-medium leading-tight text-foreground sm:text-xs">{label(service, labelLanguage)}</motion.span></AnimatePresence></motion.div></motion.div>; })}
      </motion.div>
      {!reduceMotion ? <motion.span aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.65, 0] }} transition={{ duration: 2.2, delay: 3, repeat: Infinity, repeatDelay: 7 }} className="absolute bottom-3 right-4 z-10 text-[10px] font-medium tracking-wide text-muted-foreground">EN <span className="mx-1 text-primary">↔</span> हिन्दी</motion.span> : null}
      <motion.div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: "50%", top: "51.39%" }} initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: "easeOut" }}><div className="grid size-[5.7rem] place-items-center rounded-full border-4 border-background bg-primary text-center text-primary-foreground shadow-lg shadow-primary/20 sm:size-24"><div className="flex flex-col items-center gap-0.5"><UserRound className="size-5" aria-hidden="true" /><span className="text-[11px] font-semibold">{t("profile")}</span></div></div></motion.div>
    </div>
  </figure>;
}
