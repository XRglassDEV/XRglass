// app/header.tsx
"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
      <Link href="/" className="font-extrabold tracking-tight text-lg">
        XRglass
      </Link>

      <nav className="text-sm text-slate-300 flex gap-4">
        <Link href="/about" className="hover:text-white">About</Link>
        <a href="https://xrpl.org" target="_blank" rel="noreferrer" className="hover:text-white">
          Docs
        </a>
      </nav>
    </header>
  );
}
