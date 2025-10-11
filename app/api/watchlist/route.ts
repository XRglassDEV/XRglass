// app/api/watchlist/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import {
  addItem,
  listItems,
  removeItem,
  supabaseEnabled,
  type Threshold,
  type WatchItem,
  type WatchType,
} from "../../../lib/watchlist-store";
import { randomUUID } from "crypto";

function sanitizeTarget(t: string) {
  const s = (t || "").trim();
  if (/^r[1-9A-HJ-NP-Za-km-z]{24,35}$/.test(s)) return s; // wallet
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return u.hostname.toLowerCase();
  } catch {
    return s.toLowerCase();
  }
}

export async function GET() {
  const items = await listItems();
  return NextResponse.json({ status: "ok", supabase: supabaseEnabled(), items }, { status: 200 });
}

function normalizeThreshold(value: unknown): Threshold {
  if (value === "green" || value === "orange" || value === "red") {
    return value;
  }
  return "orange";
}

function normalizeWebhook(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const type: WatchType = b?.type === "project" ? "project" : "wallet";
    const target = sanitizeTarget(String(b?.target || ""));
    const threshold = normalizeThreshold(b?.threshold);
    const webhook = normalizeWebhook(b?.webhook);
    if (!target) return NextResponse.json({ status: "error", message: "Missing target" }, { status: 400 });

    const item: WatchItem = {
      id: randomUUID(),
      type,
      target,
      threshold,
      webhook,
      createdAt: new Date().toISOString(),
    };
    await addItem(item);
    return NextResponse.json({ status: "ok", item }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request";
    return NextResponse.json({ status: "error", message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) return NextResponse.json({ status: "error", message: "Missing id" }, { status: 400 });
  await removeItem(id);
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
