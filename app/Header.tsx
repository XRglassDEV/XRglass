// app/header.tsx
export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-5xl h-14 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="font-semibold text-slate-100">
          XRglass <span className="text-cyan-400">v2</span>
        </div>
        <div className="text-xs text-slate-400 select-none">
          Scan XRP wallets &amp; projects
        </div>
      </div>
    </header>
  );
}
