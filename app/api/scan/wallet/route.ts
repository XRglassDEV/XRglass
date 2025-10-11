// app/api/scan/wallet/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import xrpl from "xrpl";
import { computeScore } from "../../../../lib/scoring";

function isLikelyXRPAddress(addr: string) {
  return typeof addr === "string" && /^r[1-9A-HJ-NP-Za-km-z]{24,35}$/.test(addr);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.trim() || "";
    if (!isLikelyXRPAddress(address)) {
      return NextResponse.json(
        { status: "error", message: "Invalid or missing XRP address." },
        { status: 400 }
      );
    }

    const endpoint = process.env.XRPL_ENDPOINT || "wss://xrplcluster.com";
    const client = new xrpl.Client(endpoint);
    await client.connect();

    let accountInfo: any = null;
    try {
      accountInfo = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
      });
    } catch (e) {}

    let txs: any[] = [];
    try {
      const txResp = await client.request({
        command: "account_tx",
        account: address,
        ledger_index_min: -1,
        ledger_index_max: -1,
        limit: 20,
        forward: false,
      });
      txs = txResp.result?.transactions || [];
    } catch (e) {}

    await client.disconnect();

    const data = {
      address,
      accountInfo: accountInfo?.result ?? null,
      transactions: txs,
      fetchedAt: new Date().toISOString(),
    };

    const scored = computeScore(data);
    return NextResponse.json(
      { status: "ok", ...scored, raw: { hasAccount: !!accountInfo?.result, txCount: txs.length } },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
