"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { label: "Platform", href: "#platform" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Stories", href: "#stories" },
  { label: "FAQ", href: "#faq" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition duration-500 ${
      scrolled ? "backdrop-blur-xl" : ""
    }`}>
      <div
        className={`mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8 ${
          scrolled ? "rounded-3xl border border-white/10 bg-slate-900/60 shadow-[0_12px_40px_rgba(8,14,35,0.55)]" : ""
        }`}
      >
        <Link href="/" className="group flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-white">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-sky-500 to-purple-500 text-lg font-bold">
            XR
          </span>
          <span className="text-xs font-medium tracking-[0.5em] text-white/80 transition group-hover:text-white">
            XRglass
          </span>
        </Link>
        <nav className="hidden items-center gap-9 text-sm text-white/70 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
          <Link
            href="/pro"
            className="btn-premium whitespace-nowrap text-xs font-semibold uppercase tracking-[0.35em] text-white"
          >
            Explore Pro
          </Link>
        </nav>
        <button
          type="button"
          aria-label="Open navigation"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:border-white/30 hover:bg-white/20 lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          <svg
            className={`h-5 w-5 transition-transform ${open ? "rotate-45" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" className={`${open ? "opacity-0" : "opacity-100"}`} />
            <path d="M6 6l12 12M18 6l-12 12" className={`${open ? "opacity-100" : "opacity-0"}`} />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="mx-auto mt-4 flex w-full max-w-7xl flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-6 shadow-[0_12px_40px_rgba(8,14,35,0.55)] sm:px-8 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-white/80 transition hover:text-white"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/pro"
            className="btn-premium w-full justify-center text-xs font-semibold uppercase tracking-[0.35em] text-white"
            onClick={() => setOpen(false)}
          >
            Explore Pro
          </Link>
        </div>
      ) : null}
    </header>
  );
}
