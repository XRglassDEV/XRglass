export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { listItems } from "../../../../lib/watchlist-store";
import type { WatchItem } from "../../../../lib/watchlist-store";

type Verdict = "green" | "orange" | "red";
type ScanResponse = { score?: Verdict; verdict?: Verdict };
type CheckSummary = {
  id: string;
  target: string;
  type: WatchItem["type"];
  verdict?: Verdict;
  notified?: boolean;
  error?: string;
  webhookError?: string;
};

const rank: Record<Verdict, number> = { green: 0, orange: 1, red: 2 };

async function call(base: string, type: WatchItem["type"], target: string): Promise<ScanResponse> {
  const url =
    type === "wallet"
      ? `${base}/api/scan/wallet?address=${encodeURIComponent(target)}`
      : `${base}/api/scan/domain?url=${encodeURIComponent(target)}`;
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`Scan failed with HTTP ${r.status}`);
  }
  return (await r.json()) as ScanResponse;
}

function parseVerdict(value: unknown): Verdict {
  if (value === "red" || value === "orange" || value === "green") {
    return value;
  }
  return "green";
}

export async function GET(req: Request) {
  const { origin } = new URL(req.url);
  const items = await listItems();
  const out: CheckSummary[] = [];

  for (const it of items) {
    try {
      const data = await call(origin, it.type, it.target);
      const verdict = parseVerdict(data.score ?? data.verdict);
      const notify = rank[verdict] >= rank[it.threshold];

      if (notify && it.webhook) {
        try {
          await fetch(it.webhook, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ type: it.type, target: it.target, verdict, at: new Date().toISOString() })
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          out.push({ id: it.id, target: it.target, type: it.type, verdict, notified: false, webhookError: message });
          continue;
        }
      }

      out.push({ id: it.id, target: it.target, type: it.type, verdict, notified: notify && Boolean(it.webhook) });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "scan failed";
      out.push({ id: it.id, target: it.target, type: it.type, error: message });
    }
  }

  return NextResponse.json({ status: "ok", items: out }, { status: 200 });
}
