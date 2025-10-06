// components/ProjectCard.tsx
"use client";

type ProjectResult = {
  status: "ok" | "error";
  message?: string;
  domain?: string;
  tomlFound?: boolean;
  tomlParsed?: Record<string, any> | null;
  github?: { repo?: string; stars?: number | null; lastCommit?: string | null } | null;
  disclaimer?: string;
};

export default function ProjectCard({ result }: { result: ProjectResult }) {
  if (!result) return null;

  if (result.status === "error") {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-900/30 p-4 shadow-sm">
        <div className="mb-1 text-rose-300 font-semibold text-sm">Project Error</div>
        <div className="text-sm text-rose-200/90">{result.message ?? "Unknown error"}</div>
      </div>
    );
  }

  const rows: Array<[string, string]> = [
    ["Domain", result.domain || "—"],
    ["xrp.toml", result.tomlFound ? "found ✅" : "not found"],
    ["GitHub repo", result.github?.repo || "—"],
    ["GitHub stars", result.github?.stars?.toString() ?? "—"],
    ["Last commit", result.github?.lastCommit || "—"],
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="px-3 py-1.5 rounded-xl bg-cyan-600/90 text-white font-semibold shadow-sm">
          Project Scan
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-2 text-sm">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2"
          >
            <span className="text-slate-300">{k}</span>
            <span className="font-medium text-slate-100">{v}</span>
          </div>
        ))}
      </div>

      {result.tomlParsed && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-slate-300 hover:text-cyan-300">
            Show xrp.toml (parsed)
          </summary>
          <pre className="mt-2 rounded-lg bg-black/70 text-white p-3 text-xs overflow-auto max-h-64">
            {JSON.stringify(result.tomlParsed, null, 2)}
          </pre>
        </details>
      )}

      {result.disclaimer && (
        <div className="mt-4 text-xs text-slate-400">⚠️ {result.disclaimer}</div>
      )}
    </div>
  );
}
