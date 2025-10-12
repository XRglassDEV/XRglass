export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { connectXRPL } from "@/lib/xrpl/connect";

export async function GET() {
  try {
    const { client, node, latency } = await connectXRPL();
    const info = await client.request({ command: "server_info" });
    const ledger = info.result?.info?.validated_ledger?.seq ?? null;
    await client.disconnect();
    return NextResponse.json({ ok: true, node, latency, ledger });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "status_failed" }, { status: 503 });
  }
}
