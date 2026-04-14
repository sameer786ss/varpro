import type { Metadata } from "next";
import { Space_Grotesk, Source_Code_Pro } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Digital Learning Support System",
  description:
    "A full-stack digital learning support platform with Supabase, AI tutor workflows, assessments, messaging, and role-based operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${sourceCodePro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--surface-0)] text-[var(--text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
