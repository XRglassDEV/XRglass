export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { addItem, listItems, removeItem, supabaseEnabled } from "../../../lib/watchlist-store";
import { randomUUID } from "crypto";

function sanitizeTarget(t: string) {
  const s = (t||"").trim();
  if (/^r[1-9A-HJ-NP-Za-km-z]{24,35}$/.test(s)) return s; // wallet
  try { const u = new URL(s.startsWith("http")?s:`https://${s}`); return u.hostname.toLowerCase(); }
  catch { return s.toLowerCase(); }
}

export async function GET() {
  const items = await listItems();
  return NextResponse.json({ status:"ok", supabase: supabaseEnabled(), items }, { status:200 });
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const type = b?.type === "project" ? "project" : "wallet";
    const target = sanitizeTarget(String(b?.target||""));
    const threshold = (b?.threshold || "orange");
    const webhook = b?.webhook ? String(b.webhook) : null;
    if (!target) return NextResponse.json({ status:"error", message:"Missing target" }, { status:400 });

    const item = { id: randomUUID(), type, target, threshold, webhook, createdAt: new Date().toISOString() };
    await addItem(item as any);
    return NextResponse.json({ status:"ok", item }, { status:200 });
  } catch (e:any) {
    return NextResponse.json({ status:"error", message:e?.message || "Bad request" }, { status:400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) return NextResponse.json({ status:"error", message:"Missing id" }, { status:400 });
  await removeItem(id);
  return NextResponse.json({ status:"ok" }, { status:200 });
}
