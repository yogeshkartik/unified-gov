"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Award, Car, FileText, GraduationCap, HeartPulse, Landmark, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCitizenPreferences, type Language } from "@/components/providers/citizen-preferences";
import { localizeServiceOrbitName } from "@/src/i18n/service-localization";

type Ring = "inner" | "outer";
type Service = { id: string; label: string; icon: LucideIcon };
type Node = { slot: number; ring: Ring; angle: number };

const services: Service[][] = [
  [{ id: "JEE_MAIN_001", label: "JEE Main", icon: GraduationCap }, { id: "PASSPORT_001", label: "Passport", icon: FileText }, { id: "DRIVING_LICENCE_001", label: "Driving Licence", icon: Car }, { id: "PM_KISAN_001", label: "PM-KISAN", icon: Landmark }, { id: "INCOME_CERTIFICATE_001", label: "Income Certificate", icon: FileText }, { id: "NATIONAL_SCHOLARSHIP_001", label: "Scholarship", icon: Award }, { id: "AYUSHMAN_BHARAT_001", label: "Ayushman Bharat", icon: HeartPulse }],
  [{ id: "NEET_UG_001", label: "NEET UG", icon: GraduationCap }, { id: "PAN_CARD_001", label: "PAN Card", icon: FileText }, { id: "VOTER_ID_001", label: "Voter ID", icon: FileText }, { id: "PMAY_001", label: "PMAY", icon: Landmark }, { id: "CASTE_CERTIFICATE_001", label: "Caste Certificate", icon: FileText }, { id: "UPSC_CSE_001", label: "UPSC CSE", icon: Award }, { id: "E_SHRAM_001", label: "e-Shram", icon: HeartPulse }],
  [{ id: "CUET_UG_001", label: "CUET UG", icon: GraduationCap }, { id: "DOMICILE_CERTIFICATE_001", label: "Domicile Certificate", icon: FileText }, { id: "DRIVING_LICENCE_001", label: "Driving Licence", icon: Car }, { id: "PM_KISAN_001", label: "PM-KISAN", icon: Landmark }, { id: "INCOME_CERTIFICATE_001", label: "Income Certificate", icon: FileText }, { id: "SSC_CGL_001", label: "SSC CGL", icon: Award }, { id: "AYUSHMAN_BHARAT_001", label: "Ayushman Bharat", icon: HeartPulse }],
];

const desktopNodes: Node[] = [
  { slot: 0, ring: "outer", angle: -90 }, { slot: 1, ring: "outer", angle: 0 }, { slot: 2, ring: "outer", angle: 90 }, { slot: 3, ring: "outer", angle: 180 },
  { slot: 4, ring: "inner", angle: -90 }, { slot: 5, ring: "inner", angle: 30 }, { slot: 6, ring: "inner", angle: 150 },
];
const mobileNodes = desktopNodes.filter((node) => [0, 1, 2, 3].includes(node.slot));
const orbit: Record<Ring, { radius: number; duration: number; direction: 1 | -1 }> = { inner: { radius: 82, duration: 42, direction: -1 }, outer: { radius: 142, duration: 58, direction: 1 } };

function point(node: Node) {
  const ring = orbit[node.ring];
  const radians = node.angle * Math.PI / 180;
  return { x: 200 + Math.cos(radians) * ring.radius, y: 180 + Math.sin(radians) * ring.radius };
}

export function ServiceOrbitAnimation() {
  const { language, t } = useCitizenPreferences();
  const reduceMotion = useReducedMotion();
  const [visibleServices, setVisibleServices] = useState(services[0]);
  const [alternateSlots, setAlternateSlots] = useState<number[]>([]);
  const [pulseSlot, setPulseSlot] = useState(0);
  const [receivedSlot, setReceivedSlot] = useState<number>();
  const tick = useRef(0);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      const slot = tick.current % desktopNodes.length;
      const nextSet = Math.floor(tick.current / desktopNodes.length + 1) % services.length;
      setVisibleServices((current) => current.map((service, index) => index === slot ? services[nextSet][index] : service));
      tick.current += 1;
    }, 3900);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    let resetTimer: number | undefined;
    const interval = window.setInterval(() => {
      const first = Math.floor(Math.random() * desktopNodes.length);
      const second = Math.floor(Math.random() * desktopNodes.length);
      setAlternateSlots([...new Set([first, second])]);
      resetTimer = window.setTimeout(() => setAlternateSlots([]), 1800);
    }, 7600);
    return () => { window.clearInterval(interval); if (resetTimer) window.clearTimeout(resetTimer); };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    let arrivalTimer: number | undefined;
    const pulse = () => {
      const slot = Math.floor(Math.random() * desktopNodes.length);
      setReceivedSlot(undefined);
      setPulseSlot(slot);
      arrivalTimer = window.setTimeout(() => setReceivedSlot(slot), 1250);
    };
    pulse();
    const interval = window.setInterval(pulse, 3600);
    return () => { window.clearInterval(interval); if (arrivalTimer) window.clearTimeout(arrivalTimer); };
  }, [reduceMotion]);

  const activePoint = point(desktopNodes[pulseSlot]);
  return (
    <figure className="relative mx-auto w-full max-w-[27rem] select-none" aria-labelledby="service-orbit-title">
      <figcaption id="service-orbit-title" className="sr-only">{language === "hi" ? "एक नागरिक प्रोफ़ाइल कई सरकारी सेवाओं में जानकारी का पुन: उपयोग करती है।" : "One citizen profile securely reuses information across many government services."}</figcaption>
      <div className="relative aspect-square min-h-[18rem] overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.05] via-background to-sky-50/40 p-3">
        <svg viewBox="0 0 400 360" className="absolute inset-0 size-full" aria-hidden="true">
          <g className="text-primary/30"><circle className="hidden sm:block" cx="200" cy="180" r="142" fill="none" stroke="currentColor" strokeWidth="1" /><circle className="hidden sm:block" cx="200" cy="180" r="82" fill="none" stroke="currentColor" strokeWidth="1" /><circle className="sm:hidden" cx="200" cy="180" r="112" fill="none" stroke="currentColor" strokeWidth="1" /></g>
          {!reduceMotion ? <motion.g key={pulseSlot} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 1.3, ease: "easeInOut" }} className="text-primary"><motion.path d={`M 200 180 L ${activePoint.x} ${activePoint.y}`} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.15, ease: "easeInOut" }} /><motion.circle r="3" fill="currentColor" animate={{ cx: [200, activePoint.x], cy: [180, activePoint.y] }} transition={{ duration: 1.15, ease: "easeInOut" }} /></motion.g> : null}
        </svg>
        <OrbitNodes nodes={desktopNodes} className="hidden sm:block" services={visibleServices} language={language} alternateSlots={alternateSlots} receivedSlot={receivedSlot} reduceMotion={reduceMotion} />
        <OrbitNodes nodes={mobileNodes} className="sm:hidden" services={visibleServices} language={language} alternateSlots={alternateSlots} receivedSlot={receivedSlot} reduceMotion={reduceMotion} mobile />
        <motion.div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: "50%", top: "50%" }} initial={reduceMotion ? false : { opacity: 0, scale: 0.78 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}><div className="grid size-[5.3rem] place-items-center rounded-full border-4 border-background bg-primary text-center text-primary-foreground shadow-md shadow-primary/15 sm:size-[5.7rem]"><div className="flex flex-col items-center gap-0.5"><UserRound className="size-5" aria-hidden="true" /><span className="text-[11px] font-semibold">{t("profile")}</span></div></div></motion.div>
      </div>
    </figure>
  );
}

function OrbitNodes({ nodes, services, language, alternateSlots, receivedSlot, reduceMotion, className, mobile = false }: { nodes: Node[]; services: Service[]; language: Language; alternateSlots: number[]; receivedSlot?: number; reduceMotion: boolean | null; className: string; mobile?: boolean }) {
  return <div className={`absolute inset-0 ${className}`}>
    {(["outer", "inner"] as Ring[]).map((ring) => {
      const ringNodes = nodes.filter((node) => mobile ? true : node.ring === ring);
      if (ringNodes.length === 0 || (mobile && ring === "inner")) return null;
      const rotation = mobile ? { duration: 54, direction: 1 as const } : orbit[ring];
      return <motion.div key={ring} className="absolute inset-0" animate={reduceMotion ? undefined : { rotate: rotation.direction * 360 }} transition={{ duration: rotation.duration, ease: "linear", repeat: Infinity }}>
        {ringNodes.map((node) => {
          const service = services[node.slot];
          const Icon = service.icon;
          const pointValue = mobile ? { x: 200 + Math.cos(node.angle * Math.PI / 180) * 112, y: 180 + Math.sin(node.angle * Math.PI / 180) * 112 } : point(node);
          const labelLanguage = alternateSlots.includes(node.slot) ? language === "en" ? "hi" : "en" : language;
          return <motion.div key={node.slot} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pointValue.x / 4}%`, top: `${pointValue.y / 3.6}%` }} initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.32, delay: node.slot * 0.07 }}>
            <motion.div animate={reduceMotion ? undefined : { rotate: rotation.direction * -360 }} transition={{ duration: rotation.duration, ease: "linear", repeat: Infinity }} className="origin-center"><motion.div animate={receivedSlot === node.slot ? { boxShadow: ["0 1px 2px rgb(15 23 42 / 0.06)", "0 0 0 4px rgb(37 99 235 / 0.13)", "0 1px 2px rgb(15 23 42 / 0.06)"] } : undefined} transition={{ duration: 0.65 }} className="flex max-w-[4.8rem] items-center gap-1.5 rounded-full border border-primary/15 bg-background/90 px-2 py-1.5 shadow-sm backdrop-blur-sm sm:max-w-[5.7rem]"><Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" /><AnimatePresence mode="wait" initial={false}><motion.span key={`${service.id}-${labelLanguage}`} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.28, ease: "easeOut" }} className="line-clamp-2 text-[10px] font-medium leading-tight text-foreground sm:text-[11px]">{localizeServiceOrbitName(service.id, service.label, labelLanguage)}</motion.span></AnimatePresence></motion.div></motion.div>
          </motion.div>;
        })}
      </motion.div>;
    })}
  </div>;
}
