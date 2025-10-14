export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const envUrl = process.env.SUPABASE_URL;
    const envKey = process.env.SUPABASE_SERVICE_ROLE;

    // Only try to log if envs exist. Never fail the build/run if missing.
    if (envUrl && envKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(envUrl, envKey, { auth: { persistSession: false } });
        await sb.from("scan_logs").insert({
          at: new Date().toISOString(),
          ip: (req.headers.get("x-forwarded-for") || "").split(",")[0] || null,
          payload: body ?? null,
          ua: req.headers.get("user-agent") || null,
        });
      } catch {
        // swallow logging errors
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "log failed" }, { status: 200 });
  }
}
