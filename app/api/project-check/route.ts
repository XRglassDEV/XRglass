// app/api/project-check/route.ts
import { NextRequest } from "next/server";
import { computeScore } from "@/lib/scoring";

export const runtime = "edge";

/* ---------------------- trusted ecosystem domains ---------------------- */
// Feel free to expand this list any time.
const TRUSTED_DOMAINS = new Set([
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

// Normalize for matching (drops leading www.)
function normalizeForMatch(d: string) {
  const clean = cleanDomain(d);
  return clean.startsWith("www.") ? clean.slice(4) : clean;
}

// HEAD with fallback to GET, with a small timeout
async function okWithTimeout(
  url: string,
  method: "HEAD" | "GET" = "HEAD",
  ms = 4000
): Promise<boolean> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { method, signal: controller.signal });
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
      return { found: true, url: u };
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
    return new Response(
      JSON.stringify({ status: "error", message: "No domain provided" }),
      { status: 400 }
    );
  }

  const domain = cleanDomain(domainRaw);
  const matchKey = normalizeForMatch(domain);

  /* ---------- short-circuit for trusted ecosystem domains ---------- */
  if (TRUSTED_DOMAINS.has(matchKey)) {
    return new Response(
      JSON.stringify({
        status: "ok",
        verdict: "green",
        points: 0,
        reasons: ["Verified ecosystem domain (allowlist)"],
        signals: [
          { key: "ecosystem_allowlist", ok: true, weight: -999 },
        ],
        details: {
          domain,
          trusted: true,
        },
        disclaimer:
          "Results are indicative only. XRglass cannot guarantee 100% accuracy.",
      }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }

  /* -------------------- normal heuristic evaluation -------------------- */
  const httpsOk = await headOk(`https://${domain}`);
  const toml = await checkToml(domain);

  const signals = [
    { key: "https_ok", ok: httpsOk, weight: 1 },
    { key: "toml_present", ok: toml.found, weight: 2 },
  ];

  const points = computeScore(signals);
  const verdict = verdictFromPoints(typeof points === "number" ? points : (points?.total ?? 0));

  const reasons: string[] = [];
  if (!httpsOk) reasons.push("HTTPS not detected (+1)");
  if (!toml.found) reasons.push("xrp.toml not found (+2)");
  else reasons.push("xrp.toml found (0)");

  return new Response(
    JSON.stringify({
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
      disclaimer:
        "Results are indicative only. XRglass cannot guarantee 100% accuracy.",
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

/* ------------------------------ handlers ------------------------------ */

export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();
    return handle(domain);
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: e?.message || "project scan failed",
      }),
      { status: 400 }
    );
  }
}

// Also support GET ?domain=example.com for browser testing
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain =
    searchParams.get("domain") || searchParams.get("url") || "";
  return handle(domain);
}
