"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const storageKey = "unified-gov-citizen-session";
interface CitizenSession { aadhaarLastFour: string; }
interface CitizenAuth { session?: CitizenSession; ready: boolean; signIn: (aadhaar: string) => void; signOut: () => void; }
const CitizenAuthContext = createContext<CitizenAuth | null>(null);

export function CitizenAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CitizenSession>();
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { try { const stored = window.localStorage.getItem(storageKey); if (stored) setSession(JSON.parse(stored) as CitizenSession); } catch {} finally { setReady(true); } }, 0); return () => window.clearTimeout(timer); }, []);
  function signIn(aadhaar: string) { const next = { aadhaarLastFour: aadhaar.slice(-4) }; window.localStorage.setItem(storageKey, JSON.stringify(next)); setSession(next); }
  function signOut() { window.localStorage.removeItem(storageKey); setSession(undefined); }
  return <CitizenAuthContext.Provider value={{ session, ready, signIn, signOut }}>{children}</CitizenAuthContext.Provider>;
}

export function useCitizenAuth() {
  const auth = useContext(CitizenAuthContext);
  if (!auth) throw new Error("useCitizenAuth must be used inside CitizenAuthProvider");
  return auth;
}
