export function ScoreBadge({ label, score }: { label: string; score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color = clamped >= 85 ? "#16a34a" : clamped >= 60 ? "#f59e0b" : "#dc2626";

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <span className="pill">{label}</span>
      <div className="flex items-center gap-4">
        <div className="bar w-44">
          <i style={{ width: `${clamped}%`, background: color }} />
        </div>
        <span className="text-2xl font-extrabold" style={{ color }}>
          {clamped}/100
        </span>
      </div>
    </div>
  );
}
