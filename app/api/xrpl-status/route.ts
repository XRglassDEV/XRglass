export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { rpcWithFallback } from "@/lib/xrpl/rpc";

type ServerInfo = {
  info?: {
    validated_ledger?: {
      seq?: number;
    };
  };
};

export async function GET() {
  const res = await rpcWithFallback<ServerInfo>(() => ({ method: "server_info", params: [{}] }));
  if (res.error) return NextResponse.json({ ok:false, error: res.error }, { status: 503 });

  const info = res.data?.info;
  const ledger = info?.validated_ledger?.seq ?? null;

  return NextResponse.json({ ok:true, node: res.node?.url, latency: res.latency, ledger });
}
