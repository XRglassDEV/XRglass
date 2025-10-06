// app/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import "./globals.css";
import Header from "./header";
import { Providers } from "./providers";

export const metadata = {
  title: "XRglass — XRP Wallet & Project Verifier",
  description:
    "Verify XRP wallets and crypto projects instantly. Avoid scams and rug pulls with transparent trust checks.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {/* Neon ripple glow + subtle grid */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.10),transparent_40%)]" />
        <div className="pointer-events-none fixed inset-0 bg-grid-slate/[0.03]" />

        <Providers>
          <Header />
          <main className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
