export const dynamic = "force-dynamic";
export const revalidate = 0;

import "./globals.css";
import Link from "next/link";
import { BUILD_TAG } from "./_internal/build";

export const metadata = { title: "XRglass", description: "See through the XRPL" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-build={BUILD_TAG}>
      <body>
        <header className="sticky top-0 z-20 bg-white/60 backdrop-blur-md border-b border-white/60">
          <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-6">
            <Link href="/" className="text-2xl font-extrabold" style={{color:"#0A79C8"}}>
              XR<span className="text-[#0B96E5]">glass</span>
            </Link>
            <div className="hidden md:flex flex-1">
              <div className="glass w-full px-4 py-2">
                <input className="w-full bg-transparent outline-none text-sm" placeholder="Search Wallet/Project" />
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link href="/dashboard">Home</Link>
              <Link href="/watchlist">Watchlist</Link>
              <Link href="/marketplace">Reports</Link>
              <Link href="/version" className="text-xs opacity-70">v</Link>
            </nav>
            <span className="pill" style={{background:"linear-gradient(180deg,#0A79C8,#0663A3)",color:"#fff"}}>XRglass Pro</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-5 py-8">{children}</main>
        <footer className="max-w-7xl mx-auto px-5 py-8 text-sm text-gray-500">© XRglass 2025 – Ripple Ecosystem</footer>
      </body>
    </html>
  );
}
