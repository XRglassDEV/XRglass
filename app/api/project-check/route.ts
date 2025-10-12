export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { rpcWithFallback } from "@/lib/xrpl/rpc";

type Verdict = "green" | "orange" | "red";
function colorVerdict(points: number): Verdict {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) {
    return NextResponse.json(
      { status: "error", message: "No address provided" },
      { status: 400 }
    );
  }

  // Ask via HTTP JSON-RPC (typed as any at the edge for safety)
  const resp = await rpcWithFallback<any>(() => ({
    method: "account_info",
    params: [{ account: address, ledger_index: "validated", strict: true }],
  }));

  // Transport / fallback error
  if (resp.error) {
    const isNetwork = resp.error === "all_nodes_failed";
    return NextResponse.json(
      {
        status: "error",
        kind: isNetwork ? "network" : "unknown",
        message: isNetwork ? "All XRPL RPC nodes failed" : resp.error,
      },
      { status: 503 }
    );
  }

  // Normalize result shape
  const result: any = resp.data ?? {};

  // The XRPL RPC can respond with { error: "actNotFound", ... }
  if (result?.error === "actNotFound" || result?.result?.error === "actNotFound") {
    return NextResponse.json({
      status: "ok",
      verdict: "orange",
      reason: "Account not found",
      node: resp.node?.url,
      latency: resp.latency,
    });
  }

  // Account data may live under result.account_data or at top-level
  const account =
    result?.account_data ?? result?.result?.account_data ?? null;

  const points = account ? 1 : 3;
  const verdict = colorVerdict(points);

  return NextResponse.json({
    status: "ok",
    verdict,
    node: resp.node?.url,
    latency: resp.latency,
    account,
  });
}
