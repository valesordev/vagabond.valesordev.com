import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";

import { AppShell } from "@/components/AppShell";
import { Providers } from "@/components/Providers";
import { LifestylePreferencesProvider } from "@/contexts/LifestylePreferencesContext";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vagabond",
  description: "Self-hosted lifestyle manager for overlanders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-density="comfortable" data-conn="online">
      <body className={`${manrope.variable} ${newsreader.variable}`}>
        <Providers>
          <LifestylePreferencesProvider>
            <AppShell>{children}</AppShell>
          </LifestylePreferencesProvider>
        </Providers>
      </body>
    </html>
  );
}
