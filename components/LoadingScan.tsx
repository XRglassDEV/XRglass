// components/LoadingScan.tsx
"use client";

export default function LoadingScan() {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" />
          <div className="absolute inset-1 rounded-full border border-emerald-400/30 animate-pulse" />
          <div className="absolute inset-0 grid place-items-center text-cyan-300">🛡️</div>
        </div>
        <div className="space-y-1">
          <div className="text-sm font-semibold">Analyzing trust signals…</div>
          <div className="text-xs text-slate-400">
            Checking wallet flags, account age, and project safety hints. This usually takes a moment.
          </div>
        </div>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded bg-slate-800">
        <div className="h-2 w-1/3 animate-[loading_1.6s_ease_infinite] bg-cyan-400/70" />
      </div>
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-110%); }
          50% { transform: translateX(20%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
}
