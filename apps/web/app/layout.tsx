import type { Metadata } from "next";
import "./globals.css";
import { CitizenPreferencesProvider } from "@/components/providers/citizen-preferences";

export const metadata: Metadata = {
  title: "Unified Government Services",
  description: "A unified portal for reusable citizen service applications.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><CitizenPreferencesProvider>{children}</CitizenPreferencesProvider></body>
    </html>
  );
}
