// components/TrustBadge.tsx
"use client";

type Props = { label: string; tone?: "good" | "warn" | "bad" | "info" };

export default function TrustBadge({ label, tone = "info" }: Props) {
  const tones = {
    good: "bg-emerald-600/10 text-emerald-600 ring-1 ring-emerald-600/20",
    warn: "bg-amber-600/10 text-amber-600 ring-1 ring-amber-600/20",
    bad:  "bg-red-600/10 text-red-600 ring-1 ring-red-600/20",
    info: "bg-sky-600/10 text-sky-600 ring-1 ring-sky-600/20",
  } as const;

  return (
    <span className={`px-2 py-1 rounded-xl text-xs font-medium ${tones[tone]}`}>
      {label}
    </span>
  );
}
