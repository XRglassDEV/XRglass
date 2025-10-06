// app/api/project-check/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { computeScore } from "@/lib/scoring";

// ✅ run on Node, never cached, always dynamic
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ---------------------- trusted ecosystem domains ---------------------- */
const TRUSTED_DOMAINS = new Set<string>([
  "xrpl.org",
  "xrplf.org",
  "ripple.com",
  "gatehub.net",
  "xumm.app",
  "bithomp.com",
]);

/* ----------------------------- utilities ------------------------------ */

function cleanDomain(input: string) {
  return input.replace(/^https?:\/\//i, "").replace(/\/+$/, "").trim().toLowerCase();
}

// drop leading www. for matching
function normalizeForMatch(d: string) {
  const clean = cleanDomain(d);
  return clean.startsWith("www.") ? clean.slice(4) : clean;
}

// HEAD with fallback to GET, with a small timeout and a UA header
async function okWithTimeout(
  url: string,
  method: "HEAD" | "GET" = "HEAD",
  ms = 4000
): Promise<boolean> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        "user-agent": "XRglass/1.0 (+https://xrglass.vercel.app)",
        accept: "text/plain,*/*",
      },
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(id);
  }
}

async function headOk(url: string, ms = 4000): Promise<boolean> {
  if (await okWithTimeout(url, "HEAD", ms)) return true;
  return okWithTimeout(url, "GET", ms);
}

async function checkToml(domain: string) {
  const candidates = [
    `https://${domain}/.well-known/xrp.toml`,
    `https://www.${domain}/.well-known/xrp.toml`,
    `https://${domain}/.well-known/xrp-ledger.toml`,
    `https://www.${domain}/.well-known/xrp-ledger.toml`,
  ];

  for (const u of candidates) {
    if (await headOk(u)) {
      return { found: true, url: u as string };
    }
  }
  return { found: false, url: null as string | null };
}

function verdictFromPoints(points: number): "green" | "orange" | "red" {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

/* -------------------------------- core -------------------------------- */

async function handle(domainRaw: string) {
  if (!domainRaw) {
    return NextResponse.json(
      { status: "error", message: "No domain provided" },
      { status: 400 }
    );
  }

  const domain = cleanDomain(domainRaw);
  const matchKey = normalizeForMatch(domain);

  // Short-circuit for ecosystem allowlist
  if (TRUSTED_DOMAINS.has(matchKey)) {
    return NextResponse.json(
      {
        status: "ok",
        verdict: "green",
        points: 0,
        reasons: ["Verified ecosystem domain (allowlist)"],
        signals: [{ key: "ecosystem_allowlist", ok: true, weight: -999 }],
        details: { domain, trusted: true },
        disclaimer: "Results are indicative only. XRglass cannot guarantee 100% accuracy.",
      },
      { status: 200 }
    );
  }

  // Heuristics
  const httpsOk = await headOk(`https://${domain}`);
  const toml = await checkToml(domain);

  const signals = [
    { key: "https_ok", ok: httpsOk, weight: 1 },
    { key: "toml_present", ok: toml.found, weight: 2 },
  ];

  // computeScore may return a number OR an object; normalize to a number
  const raw = computeScore(signals) as unknown;
  const points =
    typeof raw === "number"
      ? raw
      : typeof (raw as any)?.total === "number"
      ? (raw as any).total
      : 0;

  const verdict = verdictFromPoints(points);

  const reasons: string[] = [];
  if (!httpsOk) reasons.push("HTTPS not detected (+1)");
  if (!toml.found) reasons.push("xrp.toml not found (+2)");
  else reasons.push("xrp.toml found (0)");

  return NextResponse.json(
    {
      status: "ok",
      verdict,
      points,
      signals,
      reasons,
      details: {
        domain,
        httpsOk,
        tomlFound: toml.found,
        tomlUrl: toml.url,
        trusted: false,
      },
      disclaimer: "Results are indicative only. XRglass cannot guarantee 100% accuracy.",
    },
    { status: 200 }
  );
}

/* ------------------------------ handlers ------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { domain } = (await req.json()) as { domain?: string };
    return handle(domain ?? "");
  } catch (e: any) {
    return NextResponse.json(
      { status: "error", message: e?.message || "project scan failed" },
      { status: 400 }
    );
  }
}

// Also support GET ?domain=example.com for browser testing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain = searchParams.get("domain") || searchParams.get("url") || "";
  return handle(domain);
}
