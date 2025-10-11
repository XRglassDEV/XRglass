"use client";
import { useState, useMemo } from "react";
import DebugSwitch from "./DebugSwitch";
import type { ApiResult } from "@/types/results";

type Verdict = "green" | "orange" | "red" | "unknown";
type ReasonObj = { label: string; impact?: number };
function isReasonObj(x: unknown): x is ReasonObj {
  return !!x && typeof x === "object" && "label" in x;
}
function badgeStyle(v?: Verdict) {
  switch (v) {
    case "green": return "bg-emerald-600 text-white";
    case "orange": return "bg-amber-500 text-white";
    case "red": return "bg-rose-600 text-white";
    default: return "bg-slate-600 text-white";
  }
}

export default function ResultCard({ result }: { result: ApiResult | null }) {
  const [debug, setDebug] = useState(false);

  const badges = useMemo<string[]>(() => {
    type WithBadges = { normalized?: { badges?: unknown } };
    const raw = (result as unknown as WithBadges)?.normalized?.badges;
    if (Array.isArray(raw)) return Array.from(new Set(raw.map(String))).slice(0, 6);
    return [];
  }, [result]);

  const chipTone = (impact: number) =>
    impact > 0
      ? "border-rose-400 text-rose-600 dark:text-rose-400"
      : impact < 0
      ? "border-emerald-400 text-emerald-700 dark:text-emerald-300"
      : "border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300";

  const flagsList = useMemo<[string, boolean][]>(() => {
    type WithFlags = { details?: { flagsDecoded?: Record<string, unknown> } };
    const map = (result as unknown as WithFlags)?.details?.flagsDecoded ?? {};
    return Object.entries(map).map(([k, v]) => [k, Boolean(v)]);
  }, [result]);

  if (!result) return null;

  if (result.status === "error") {
    return (
      <div className="rounded-2xl border border-rose-300/60 bg-rose-500/10 p-3">
        <div className="mb-1 text-rose-500 font-semibold text-sm">API Error</div>
        <div className="text-xs opacity-90">{result.message ?? "Unknown error"}</div>
      </div>
    );
  }

  const { verdict, points, reasons = [], details, disclaimer } = result;

  const addressValue = typeof details?.address === "string" ? details.address : "—";
  const accountAgeValue =
    typeof details?.accountAgeDays === "number" ? details.accountAgeDays : "n/a";
  const ownerCountValue =
    typeof details?.ownerCount === "number"
      ? details.ownerCount.toString()
      : typeof details?.ownerCount === "string"
      ? details.ownerCount
      : "0";
  const domainValue = typeof details?.domain === "string" ? details.domain : "—";
  const tomlFoundValue = details?.tomlFound === true;
  const addressListedValue = details?.addressListed === true;
  const regularKeySetValue = details?.regularKeySet === true;

  const ringClass =
    verdict === "green" ? "ring-1 ring-emerald-400/30" :
    verdict === "orange" ? "ring-1 ring-amber-400/30" :
    verdict === "red" ? "ring-1 ring-rose-400/30" : "";

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/50 p-3 md:p-4 shadow-sm space-y-3 ${ringClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${badgeStyle(verdict)}`}>
          {verdict === "green" && "✅ Safe"}
          {verdict === "orange" && "🟠 Caution"}
          {verdict === "red" && "⛔ Risky"}
          {!verdict && "ℹ️ Result"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] opacity-70">Score: {typeof points === "number" ? points : "—"}</span>
          <DebugSwitch onChange={setDebug} />
        </div>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span
              key={b}
              className={`px-2 py-0.5 rounded-full text-[11px] ring-1 ${
                /trusted|allowlist|verified/i.test(b)
                  ? "ring-emerald-600/25 text-emerald-700 dark:text-emerald-300 bg-emerald-600/10"
                  : /blocked|deny|blacklist/i.test(b)
                  ? "ring-rose-600/25 text-rose-600 dark:text-rose-400 bg-rose-600/10"
                  : "ring-sky-600/25 text-sky-700 dark:text-sky-300 bg-sky-600/10"
              }`}
              title={b}
            >
              {b}
            </span>
          ))}
        </div>
      )}

      {Array.isArray(reasons) && reasons.length > 0 && (
        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] no-scrollbar">
          <div className="flex gap-1.5 pr-1">
            {reasons.map((r, i) => {
              const label = typeof r === "string" ? r : isReasonObj(r) ? r.label : String(r);
              const impact = typeof r === "string" ? 0 : isReasonObj(r) ? Number(r.impact ?? 0) : 0;
              return (
                <span
                  key={`${label}-${i}`}
                  className={`whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] border ${chipTone(impact)}`}
                  title={impact ? `impact ${impact > 0 ? `+${impact}` : impact}` : undefined}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {debug && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
            <div><span className="opacity-60">Address:</span> <span className="font-mono">{addressValue}</span></div>
            <div><span className="opacity-60">Age(d):</span> <b>{accountAgeValue}</b></div>
            <div><span className="opacity-60">OwnerCnt:</span> <b>{ownerCountValue}</b></div>
            <div><span className="opacity-60">Domain:</span> <b className="break-all">{domainValue}</b></div>
            <div><span className="opacity-60">xrp.toml:</span> <b>{tomlFoundValue ? "found ✅" : "not found"}</b></div>
            <div><span className="opacity-60">TOML listed:</span> <b>{addressListedValue ? "yes" : "no"}</b></div>
            <div><span className="opacity-60">RegularKey:</span> <b>{regularKeySetValue ? "yes" : "no"}</b></div>
          </div>

          {flagsList.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-1">Flags</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-28 overflow-auto pr-1">
                {flagsList.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border px-2 py-1 text-[11px] border-slate-200 dark:border-slate-800">
                    <span className="truncate mr-2">{k}</span>
                    <span className={`font-semibold ${v ? "text-emerald-500" : "text-slate-400"}`}>{v ? "true" : "false"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {disclaimer && <div className="text-[11px] opacity-70">⚠️ {disclaimer}</div>}
    </div>
  );
}
