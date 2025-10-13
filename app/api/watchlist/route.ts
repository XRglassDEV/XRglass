import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id")?.trim();
  if (!userId) {
    return NextResponse.json({ error: "missing user_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userId = body?.user_id?.trim();
  const address = body?.address?.trim();

  if (!userId || !address) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("watchlist")
    .insert({ user_id: userId, address })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id")?.trim();
  const address = searchParams.get("address")?.trim();

  if (!userId || !address) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("address", address);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
