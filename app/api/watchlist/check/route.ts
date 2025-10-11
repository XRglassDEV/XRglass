// app/api/watchlist/check/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { listItems, type WatchType } from "../../../../lib/watchlist-store";

type VerdictColor = "green" | "orange" | "red";
type ScanResponse = {
  score?: unknown;
  verdict?: unknown;
  scoreValue?: number | null;
  summary?: string | null;
};
type CheckResult =
  | { id: string; target: string; type: WatchType; verdict: VerdictColor; notified: boolean; webhookError?: string }
  | { id: string; target: string; type: WatchType; error: string };

const rank: Record<VerdictColor, number> = { green: 0, orange: 1, red: 2 };
const allowedVerdicts: VerdictColor[] = ["green", "orange", "red"];

function normalizeVerdict(candidate: unknown): VerdictColor | null {
  return allowedVerdicts.includes(candidate as VerdictColor) ? (candidate as VerdictColor) : null;
}

function pickVerdict(data: ScanResponse): VerdictColor {
  const fromScore = normalizeVerdict(data.score);
  if (fromScore) return fromScore;
  const fromVerdict = normalizeVerdict(data.verdict);
  if (fromVerdict) return fromVerdict;
  return "green";
}

async function scan(base: string, type: WatchType, target: string): Promise<ScanResponse> {
  const url =
    type === "wallet"
      ? `${base}/api/scan/wallet?address=${encodeURIComponent(target)}`
      : `${base}/api/scan/domain?url=${encodeURIComponent(target)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Scan failed with ${response.status}`);
  }
  return (await response.json()) as ScanResponse;
}

export async function GET(req: Request) {
  const { origin } = new URL(req.url);
  const items = await listItems();
  const results: CheckResult[] = [];

  for (const it of items) {
    try {
      const data = await scan(origin, it.type, it.target);
      const verdict = pickVerdict(data);
      const shouldNotify = rank[verdict] >= rank[it.threshold as VerdictColor];

      if (shouldNotify && it.webhook) {
        try {
          await fetch(it.webhook, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              type: it.type,
              target: it.target,
              verdict,
              scoreValue: data?.scoreValue ?? null,
              summary: data?.summary ?? null,
              at: new Date().toISOString(),
            }),
          });
        } catch (error) {
          const webhookError = error instanceof Error ? error.message : String(error);
          results.push({ id: it.id, target: it.target, verdict, notified: false, type: it.type, webhookError });
          continue;
        }
      }
      results.push({ id: it.id, target: it.target, type: it.type, verdict, notified: shouldNotify && !!it.webhook });
    } catch (error) {
      const message = error instanceof Error ? error.message : "scan failed";
      results.push({ id: it.id, target: it.target, type: it.type, error: message });
    }
  }

  return NextResponse.json({ status: "ok", count: items.length, items: results }, { status: 200 });
}
