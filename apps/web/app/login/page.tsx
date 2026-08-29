"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Landmark, ShieldCheck } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCitizenAuth } from "@/components/providers/citizen-auth";
import { useCitizenPreferences } from "@/components/providers/citizen-preferences";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useCitizenAuth();
  const { t } = useCitizenPreferences();
  const [aadhaar, setAadhaar] = useState("123456789000");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("123456");
  const [error, setError] = useState<string>();
  const returnTo = searchParams.get("returnTo")?.startsWith("/") ? searchParams.get("returnTo")! : "/dashboard";
  function requestOtp() { if (!/^\d{12}$/.test(aadhaar.replaceAll(" ", ""))) { setError(t("aadhaarValidation")); return; } setError(undefined); setOtpSent(true); }
  function verifyOtp() { if (otp !== "123456") { setError(t("otpValidation")); return; } signIn(aadhaar.replaceAll(" ", "")); router.replace(returnTo); }
  return <div className="min-h-screen"><main className="mx-auto flex min-h-screen max-w-md items-center p-4"><Card className="w-full border-t-4 border-t-primary"><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm"><Landmark className="size-5" /></div><CardTitle>{t("aadhaarSignIn")}</CardTitle><p className="text-sm leading-6 text-muted-foreground">{t("aadhaarSignInDescription")}</p></CardHeader><CardContent className="space-y-5">{!otpSent ? <><div className="space-y-2"><Label htmlFor="aadhaar">{t("aadhaarNumber")}</Label><Input id="aadhaar" inputMode="numeric" autoComplete="off" maxLength={12} value={aadhaar} onChange={(event) => setAadhaar(event.target.value.replace(/\D/g, ""))} placeholder={t("aadhaarPlaceholder")} /></div><Button className="w-full" size="lg" onPress={requestOtp}>{t("getOtp")}</Button></> : <><div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900"><ShieldCheck className="mr-2 inline size-4 text-primary" />{t("otpSent")}</div><div className="space-y-2"><Label htmlFor="otp">{t("oneTimePassword")}</Label><Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder={t("otpPlaceholder")} /></div><Button className="w-full" size="lg" onPress={verifyOtp}>{t("verifySignIn")}</Button><button type="button" className="w-full text-sm text-primary hover:underline" onClick={() => { setOtpSent(false); setOtp(""); }}>{t("differentAadhaar")}</button></>}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<LinkButton href="/services" variant="link" className="w-full">{t("exploreWithoutSignIn")}</LinkButton></CardContent></Card></main></div>;
}
