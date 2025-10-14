import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import AnimatedBackground from "@/components/AnimatedBackground";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Providers } from "./providers";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "XRglass — Ultra-premium intelligence for XRPL due diligence",
  description:
    "XRglass delivers cinematic monitoring, instant wallet intelligence, and trust automations for elite XRPL teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <body className="bg-surface text-slate-100 antialiased">
        <Providers>
          <div className="relative min-h-screen overflow-hidden">
            <AnimatedBackground />
            <div className="relative z-10 flex min-h-screen flex-col">
              <Header />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-20 sm:px-8 lg:max-w-7xl">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
