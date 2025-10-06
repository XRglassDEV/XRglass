// components/StatusBadge.tsx  (of inline in app/page.tsx)
type Tone = "green" | "orange" | "red" | "info" | "error";

const STYLES: Record<Tone, { bg: string; dot: string; text: string }> = {
  green: {
    bg: "bg-emerald-600/15 border border-emerald-500/30",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  orange: {
    bg: "bg-amber-600/15 border border-amber-500/30",
    dot: "bg-amber-400",
    text: "text-amber-300",
  },
  red: {
    bg: "bg-rose-600/15 border border-rose-500/30",
    dot: "bg-rose-400",
    text: "text-rose-300",
  },
  info: {
    bg: "bg-slate-600/15 border border-slate-500/30",
    dot: "bg-slate-400",
    text: "text-slate-300",
  },
  error: {
    bg: "bg-rose-600/15 border border-rose-500/30",
    dot: "bg-rose-400",
    text: "text-rose-300",
  },
};

export default function StatusBadge({
  tone = "info",
  text,
}: {
  tone?: Tone;
  text: string;
}) {
  const s = STYLES[tone] ?? STYLES.info; // ✅ altijd een fallback
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${s.bg} ${s.text}`}>
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {text}
    </span>
  );
}
