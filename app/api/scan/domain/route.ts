// app/api/scan/domain/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

function normalizeUrl(input: string) {
  try {
    return new URL(input.startsWith("http") ? input : `https://${input}`);
  } catch {
    return null;
  }
}

function levenshtein(a: string, b: string) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

const KNOWN_DOMAINS = [
  "xrpl.org",
  "xrplf.org",
  "ripple.com",
  "xumm.app",
  "bithomp.com",
  "gatehub.net"
];

async function headRequest(url: URL) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 5000);
  try {
    const response = await fetch(url.toString(), { method: "HEAD", signal: ctrl.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("url") || "").trim();

  const parsed = normalizeUrl(query);
  if (!parsed) {
    return NextResponse.json(
      { status: "error", message: "Provide ?url=" },
      { status: 400 }
    );
  }

  const domain = parsed.hostname.toLowerCase();
  const isHttps = parsed.protocol === "https:";
  const headOk = await headRequest(parsed);

  const strippedDomain = domain.replace(/^www\./, "");
  const distances = KNOWN_DOMAINS.map((known) => ({
    known,
    distance: levenshtein(strippedDomain, known)
  })).sort((a, b) => a.distance - b.distance);

  const nearest = distances[0];

  const signals: Array<{ id: string; label: string; severity: string; evidence?: string }> = [];
  let scoreValue = 0;

  if (!isHttps) {
    scoreValue += 40;
    signals.push({ id: "no_https", label: "No HTTPS", severity: "high" });
  }

  if (!headOk) {
    scoreValue += 10;
    signals.push({ id: "head_failed", label: "HEAD request failed", severity: "low" });
  }

  if (nearest && nearest.distance <= 2) {
    scoreValue += 20;
    signals.push({
      id: "typo_risk",
      label: `Domain similar to ${nearest.known}`,
      severity: "medium",
      evidence: `distance=${nearest.distance}`
    });
  }

  const tld = domain.split(".").pop();
  if (tld && tld.length === 2) {
    scoreValue += 5;
    signals.push({
      id: "ccTLD",
      label: "Country-code TLD (manual review)",
      severity: "low"
    });
  }

  const verdict = scoreValue >= 70 ? "red" : scoreValue >= 35 ? "orange" : "green";
  const summary =
    verdict === "red"
      ? "High risk — HTTPS missing or strong similarity to known brand."
      : verdict === "orange"
        ? "Moderate risk — some indicators present."
        : "Low risk — no major indicators.";

  return NextResponse.json(
    {
      status: "ok",
      domain,
      verdict,
      scoreValue,
      signals,
      summary,
      checkedAt: new Date().toISOString()
    },
    { status: 200 }
  );
}
