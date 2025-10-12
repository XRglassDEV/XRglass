export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { listItems } from "../../../../lib/watchlist-store";

const rank: Record<string, number> = { green:0, orange:1, red:2 };

async function scan(base: string, type: "wallet"|"project", target: string) {
  const url = type === "wallet"
    ? `${base}/api/scan/wallet?address=${encodeURIComponent(target)}`
    : `${base}/api/scan/domain?url=${encodeURIComponent(target)}`;
  const r = await fetch(url);
  return r.json();
}

export async function GET(req: Request) {
  const { origin } = new URL(req.url);
  const items = await listItems();
  const results: any[] = [];

  for (const it of items) {
    try {
      const data = await scan(origin, it.type as any, it.target);
      const verdict = (data?.score || data?.verdict || "green") as "green"|"orange"|"red";
      const shouldNotify = rank[verdict] >= rank[(it as any).threshold];

      if (shouldNotify && (it as any).webhook) {
        try {
          await fetch((it as any).webhook, {
            method: "POST",
            headers: { "content-type":"application/json" },
            body: JSON.stringify({
              type: it.type, target: it.target, verdict,
              scoreValue: data?.scoreValue ?? null,
              summary: data?.summary ?? null,
              at: new Date().toISOString()
            })
          });
        } catch (e:any) {
          results.push({ id: (it as any).id, target: it.target, verdict, notified:false, webhookError:String(e) });
          continue;
        }
      }
      results.push({ id: (it as any).id, target: it.target, type: it.type, verdict, notified: shouldNotify && !!(it as any).webhook });
    } catch (e:any) {
      results.push({ id: (it as any).id, target: it.target, type: it.type, error: e?.message || "scan failed" });
    }
  }

  return NextResponse.json({ status:"ok", count: items.length, items: results }, { status:200 });
}
