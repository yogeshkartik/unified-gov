import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified Government Services — Demo",
  description: "A synthetic-data prototype for reusable citizen service applications.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
