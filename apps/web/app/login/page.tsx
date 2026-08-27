"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Landmark, ShieldCheck } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCitizenAuth } from "@/components/providers/citizen-auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useCitizenAuth();
  const [aadhaar, setAadhaar] = useState("123456789000");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("123456");
  const [error, setError] = useState<string>();
  const returnTo = searchParams.get("returnTo")?.startsWith("/") ? searchParams.get("returnTo")! : "/dashboard";
  function requestOtp() { if (!/^\d{12}$/.test(aadhaar.replaceAll(" ", ""))) { setError("Enter your 12-digit Aadhaar number."); return; } setError(undefined); setOtpSent(true); }
  function verifyOtp() { if (otp !== "123456") { setError("Enter the 6-digit OTP sent to your registered mobile number."); return; } signIn(aadhaar.replaceAll(" ", "")); router.replace(returnTo); }
  return <div className="min-h-screen"><main className="mx-auto flex min-h-screen max-w-md items-center p-4"><Card className="w-full border-t-4 border-t-primary"><CardHeader><div className="mb-2 grid size-10 place-items-center rounded-lg bg-gradient-to-br from-primary to-blue-700 text-primary-foreground shadow-sm"><Landmark className="size-5" /></div><CardTitle>Aadhaar sign in</CardTitle><p className="text-sm leading-6 text-muted-foreground">Verify your identity with a one-time password sent to your registered mobile number.</p></CardHeader><CardContent className="space-y-5">{!otpSent ? <><div className="space-y-2"><Label htmlFor="aadhaar">Aadhaar number</Label><Input id="aadhaar" inputMode="numeric" autoComplete="off" maxLength={12} value={aadhaar} onChange={(event) => setAadhaar(event.target.value.replace(/\D/g, ""))} placeholder="12-digit Aadhaar number" /></div><Button className="w-full" size="lg" onPress={requestOtp}>Get OTP</Button></> : <><div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900"><ShieldCheck className="mr-2 inline size-4 text-primary" />OTP sent to the mobile number linked with Aadhaar.</div><div className="space-y-2"><Label htmlFor="otp">One-time password</Label><Input id="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} placeholder="Enter 6-digit OTP" /></div><Button className="w-full" size="lg" onPress={verifyOtp}>Verify & sign in</Button><button type="button" className="w-full text-sm text-primary hover:underline" onClick={() => { setOtpSent(false); setOtp(""); }}>Use a different Aadhaar number</button></>}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<LinkButton href="/services" variant="link" className="w-full">Explore services without signing in</LinkButton></CardContent></Card></main></div>;
}
