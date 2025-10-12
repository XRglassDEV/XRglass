export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

import { summarizeProbe } from "@/lib/xrpl/connect";
import { XRPL_MAINNET_NODES } from "@/lib/xrpl/nodes";
import { probeNode } from "@/lib/xrpl/connect";

export async function GET() {
  try {
    const results = await Promise.all(
      XRPL_MAINNET_NODES.map(async (node) => {
        const probe = await probeNode(node);
        return probe;
      }),
    );

    const payload = summarizeProbe(results);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        generatedAt: Date.now(),
        total: 0,
        online: 0,
        nodes: [],
        error: message,
      },
      { status: 500 },
    );
  }
}
