import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-sky-100">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/xrglass-logo.svg" alt="XRglass" width={120} height={28} priority />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-slate-700">
          <Link href="/" className="hover:text-sky-700">Home</Link>
          <Link href="/dashboard" className="hover:text-sky-700">Watchlist</Link>
          <Link href="/pro" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-sky-500 text-white shadow-sm hover:bg-sky-400">
            XRglass Pro
          </Link>
        </nav>
      </div>
    </header>
  );
}
