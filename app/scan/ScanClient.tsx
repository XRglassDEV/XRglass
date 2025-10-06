// app/scan/ScanClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ResultCard from "@/components/ResultCard";
import ProjectCard from "@/components/ProjectCard";

type ApiResult = any;

export default function ScanClient() {
  const params = useSearchParams();

  // inputs from URL
  const type = (params.get("type") || "wallet").toLowerCase();
  const address = params.get("address")?.trim() || "";
  const domain = params.get("domain")?.trim() || "";

  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const qs = useMemo(() => {
    if (type === "project" && domain) return `/api/project?domain=${encodeURIComponent(domain)}`;
    if (type === "wallet" && address) return `/api/check?address=${encodeURIComponent(address)}`;
    return "";
  }, [type, address, domain]);

  useEffect(() => {
    setErr(null);
    setResult(null);
    if (!qs) return;
    setLoading(true);
    fetch(qs)
      .then((r) => r.json())
      .then((j) => setResult(j))
      .catch((e) => setErr(String(e)))
      .finally(() => setLoading(false));
  }, [qs]);

  // helper tips
  const hint =
    type === "project"
      ? <>Add <code>?type=project&amp;domain=example.com</code> to the URL.</>
      : <>Add <code>?type=wallet&amp;address=r...</code> to the URL.</>;

  return (
    <>
      {!qs && <div className="opacity-70">{hint}</div>}
      {loading && <div className="opacity-70">Loading…</div>}
      {err && (
        <div className="rounded-xl border border-rose-400/50 bg-rose-500/10 p-3 text-sm">
          <b className="text-rose-400">Error:</b> {err}
        </div>
      )}

      {/* Render by type */}
      {result && type === "wallet" && <ResultCard result={result} />}
      {result && type === "project" && <ProjectCard result={result} />}
    </>
  );
}