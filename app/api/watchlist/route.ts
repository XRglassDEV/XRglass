export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { addItem, listItems, removeItem, supabaseEnabled } from "../../../lib/watchlist-store";
import type { Threshold, WatchItem, WatchType } from "../../../lib/watchlist-store";
import { randomUUID } from "crypto";

function sanitizeTarget(t: string) {
  const s = (t || "").trim();
  if (/^r[1-9A-HJ-NP-Za-km-z]{24,35}$/.test(s)) return s;
  try {
    const url = s.startsWith("http") ? s : `https://${s}`;
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return s.toLowerCase();
  }
}
export async function GET() {
  const items = await listItems();
  return NextResponse.json({ status:"ok", supabase: supabaseEnabled(), items }, { status:200 });
}
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<WatchItem>;
    const type: WatchType = body?.type === "project" ? "project" : "wallet";
    const target = sanitizeTarget(String(body?.target || ""));
    const allowed: Threshold[] = ["green", "orange", "red"];
    const threshold: Threshold = allowed.includes(body?.threshold as Threshold)
      ? (body?.threshold as Threshold)
      : "orange";
    const webhook = body?.webhook ? String(body.webhook) : null;
    if (!target) {
      return NextResponse.json({ status:"error", message:"Missing target" }, { status:400 });
    }
    const item: WatchItem = {
      id: randomUUID(),
      type,
      target,
      threshold,
      webhook,
      createdAt: new Date().toISOString()
    };
    await addItem(item);
    return NextResponse.json({ status:"ok", item }, { status:200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Bad request";
    return NextResponse.json({ status:"error", message }, { status:400 });
  }
}
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) return NextResponse.json({ status:"error", message:"Missing id" }, { status:400 });
  await removeItem(id);
  return NextResponse.json({ status:"ok" }, { status:200 });
}
