// app/api/project-check/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { computeScore } from "@/lib/scoring";
import type { ApiResponse, ApiOk, ApiErr, Verdict } from "@/types/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TRUSTED_DOMAINS = new Set<string>([
  "xrpl.org",
  "xrplf.org",
  "ripple.com",
  "gatehub.net",
  "xumm.app",
  "bithomp.com",
]);

const DISCLAIMER =
  "Results are indicative only. XRglass cannot guarantee 100% accuracy.";

type Signal = { key: string; ok: boolean; weight: number; detail?: string };
type TomlCheck = { found: boolean; url: string | null };

type Details = {
  domain: string;
  httpsOk: boolean;
  tomlFound: boolean;
  tomlUrl: string | null;
  trusted: boolean;
  scorePercent: number;
  scoreLevel: string;
};

function ok(verdict: Verdict, extra: Omit<ApiOk, "status" | "verdict"> = {}): ApiOk {
  return { status: "ok", verdict, ...extra };
}

function err(message: string, code?: string): ApiErr {
  return { status: "error", message, code };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 10_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function cleanDomain(input: string): string {
  return input
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .trim()
    .toLowerCase();
}

function normalizeForMatch(d: string): string {
  const clean = cleanDomain(d);
  return clean.startsWith("www.") ? clean.slice(4) : clean;
}

async function headOk(url: string, ms = 10_000): Promise<boolean> {
  try {
    const headRes = await fetchWithTimeout(
      url,
      {
        method: "HEAD",
        headers: {
          "user-agent": "XRglass/1.0 (+https://xrglass.vercel.app)",
          accept: "text/plain,*/*",
        },
      },
      ms
    );
    if (headRes.ok) return true;
  } catch {
    // ignore and retry with GET below
  }

  try {
    const getRes = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "user-agent": "XRglass/1.0 (+https://xrglass.vercel.app)",
          accept: "text/plain,*/*",
        },
      },
      ms
    );
    return getRes.ok;
  } catch {
    return false;
  }
}

async function checkToml(domain: string): Promise<TomlCheck> {
  const candidates = [
    `https://${domain}/.well-known/xrp.toml`,
    `https://www.${domain}/.well-known/xrp.toml`,
    `https://${domain}/.well-known/xrp-ledger.toml`,
    `https://www.${domain}/.well-known/xrp-ledger.toml`,
  ];

  for (const url of candidates) {
    if (await headOk(url)) {
      return { found: true, url };
    }
  }

  return { found: false, url: null };
}

function verdictFromPoints(points: number): Verdict {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

function parseDomain(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed ? trimmed : null;
}

async function handle(domainRaw: string): Promise<NextResponse<ApiResponse>> {
  try {
    if (!domainRaw) {
      return NextResponse.json<ApiResponse>(err("No domain provided"), {
        status: 400,
      });
    }

    const domain = cleanDomain(domainRaw);
    const matchKey = normalizeForMatch(domain);

    if (!domain) {
      return NextResponse.json<ApiResponse>(err("Domain is invalid"), {
        status: 400,
      });
    }

    if (TRUSTED_DOMAINS.has(matchKey)) {
      const trustedDetails: Details = {
        domain,
        httpsOk: true,
        tomlFound: true,
        tomlUrl: `https://${domain}/.well-known/xrp.toml`,
        trusted: true,
        scorePercent: 100,
        scoreLevel: "green",
      };

      return NextResponse.json<ApiResponse>(
        ok("green", {
          points: 0,
          reasons: ["Verified ecosystem domain (allowlist)"],
          signals: [
            { key: "ecosystem_allowlist", ok: true, weight: -999 } satisfies Signal,
          ],
          details: trustedDetails,
          disclaimer: DISCLAIMER,
        }),
        { status: 200 }
      );
    }

    const httpsOk = await headOk(`https://${domain}`);
    const toml = await checkToml(domain);

    const signals: Signal[] = [
      { key: "https_ok", ok: httpsOk, weight: 1 },
      { key: "toml_present", ok: toml.found, weight: 2 },
    ];

    const scoreCard = computeScore(signals);
    const points = signals.reduce((total, signal) => total + (signal.ok ? 0 : signal.weight), 0);
    const verdict = verdictFromPoints(points);

    const reasons: string[] = [];
    if (!httpsOk) reasons.push("HTTPS not detected (+1)");
    if (!toml.found) reasons.push("xrp.toml not found (+2)");
    else reasons.push("xrp.toml found (0)");

    const details: Details = {
      domain,
      httpsOk,
      tomlFound: toml.found,
      tomlUrl: toml.url,
      trusted: false,
      scorePercent: scoreCard.percent,
      scoreLevel: scoreCard.level,
    };

    return NextResponse.json<ApiResponse>(
      ok(verdict, {
        points,
        signals,
        reasons,
        details,
        disclaimer: DISCLAIMER,
      }),
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(err("Internal server error"), {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json<ApiResponse>(err("Invalid JSON body"), {
      status: 400,
    });
  }

  if (typeof parsed !== "object" || parsed === null) {
    return NextResponse.json<ApiResponse>(err("Invalid JSON body"), {
      status: 400,
    });
  }

  const record = parsed as Record<string, unknown>;
  const domain = parseDomain(record.domain);

  if (!domain) {
    return NextResponse.json<ApiResponse>(err("No domain provided"), {
      status: 400,
    });
  }

  return handle(domain);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const domain =
    parseDomain(searchParams.get("domain")) ??
    parseDomain(searchParams.get("url"));

  if (!domain) {
    return NextResponse.json<ApiResponse>(err("No domain provided"), {
      status: 400,
    });
  }

  return handle(domain);
}
