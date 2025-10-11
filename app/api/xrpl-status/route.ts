export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { connectXRPL } from "@/lib/xrpl/connect";

export async function GET() {
  try {
    const { client, node, latency } = await connectXRPL();
    try {
      const info = await client.request({ command: "server_info" });
      const ledger = info.result?.info?.validated_ledger?.seq ?? null;
      return NextResponse.json({ ok: true, node, latency, ledger });
    } finally {
      await client.disconnect();
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "failed" },
      { status: 503 },
    );
  }
}
