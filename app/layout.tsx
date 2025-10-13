import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import { Providers } from "./providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "XRglass — XRP Wallet & Project Verifier",
  description:
    "Verify XRP wallets and crypto projects instantly. Avoid scams and rug pulls with transparent trust checks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen text-slate-800 antialiased">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
