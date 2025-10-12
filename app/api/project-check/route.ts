export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { rpcWithFallback } from "@/lib/xrpl/rpc";

type AccountInfoResult = {
  account_data?: Record<string, unknown>;
  error?: string;
  status?: string;
};

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
    return NextResponse.json({ status: "error", message: "No address provided" }, { status: 400 });
  }

  const resp = await rpcWithFallback<AccountInfoResult>(() => ({
    method: "account_info",
    params: [{ account: address, ledger_index: "validated", strict: true }]
  }));

  if (resp.error) {
    const isNetwork = resp.error === "all_nodes_failed";
    return NextResponse.json({
      status: "error",
      kind: isNetwork ? "network" : "unknown",
      message: isNetwork ? "All XRPL RPC nodes failed" : resp.error
    }, { status: 503 });
  }

  const result = resp.data;
  if (result?.error === "actNotFound") {
    return NextResponse.json({
      status: "ok",
      verdict: "orange",
      reason: "Account not found",
      node: resp.node?.url,
      latency: resp.latency
    });
  }

  const acc = result?.account_data ?? null;
  const points = acc ? 1 : 3;
  const verdict = colorVerdict(points);

  return NextResponse.json({
    status: "ok",
    verdict,
    node: resp.node?.url,
    latency: resp.latency,
    account: acc
  });
}
