import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

type AddonPayload = {
  user_id?: string;
  addon_type?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AddonPayload;
  const userId = body.user_id?.trim();
  const addonType = body.addon_type?.trim();

  if (!userId || !addonType) {
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  }

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("plan", "pro")
    .eq("status", "active")
    .maybeSingle();

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  if (!subscription) {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("addons")
    .insert({
      user_id: userId,
      addon_type: addonType,
      status: "active",
      linked_subscription: subscription.id,
    })
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}
