// app/api/scan/wallet/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { computeWalletScore } from "../../../../lib/scoring-wallet";

// Allow override via env: comma-separated list
const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",          // Anycast, JSON-RPC
  "https://s1.ripple.com:51234",      // Ripple public
  "https://rippled.xrpscan.com"       // XRPSCAN relay
];

function getRpcEndpoints(): string[] {
  const env = process.env.XRPL_RPC_ENDPOINTS;
  if (!env) return DEFAULT_ENDPOINTS;
  return env.split(",").map(s => s.trim()).filter(Boolean);
}

function isLikelyXRPAddress(addr: string) {
  return typeof addr === "string" && /^r[1-9A-HJ-NP-Za-km-z]{24,35}$/.test(addr);
}

async function rpcRequest<T=any>(url: string, body: any, timeoutMs = 5000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, ...body }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json?.error) throw new Error(json.error?.message || "RPC error");
    // xrplcluster returns rippled-style fields without jsonrpc wrapper sometimes; handle both
    return json?.result ?? json;
  } finally {
    clearTimeout(t);
  }
}

async function rpcWithFallback<T=any>(body: any, endpoints = getRpcEndpoints()): Promise<T> {
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      return await rpcRequest<T>(ep, body);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("All RPC endpoints failed");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = (searchParams.get("address") || "").trim();

    if (!isLikelyXRPAddress(address)) {
      return NextResponse.json(
        { status: "error", message: "Invalid or missing XRP address." },
        { status: 400 }
      );
    }

    // 1) account_info
    let accountInfo: any = null;
    try {
      accountInfo = await rpcWithFallback({
        method: "account_info",
        params: [{ account: address, ledger_index: "validated" }]
      });
    } catch (e: any) {
      // If account not found, rippled returns an error; we handle that downstream as a signal
      accountInfo = null;
    }

    // 2) account_tx (last 20)
    let txs: any[] = [];
    try {
      const resp: any = await rpcWithFallback({
        method: "account_tx",
        params: [{
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 20,
          forward: false
        }]
      });
      txs = resp?.transactions || resp?.result?.transactions || [];
    } catch (e) {
      // Non-fatal
      txs = [];
    }

    const data = {
      address,
      accountInfo: accountInfo ?? null,
      transactions: txs,
      fetchedAt: new Date().toISOString(),
    };

    const scored = computeWalletScore(data);
    return NextResponse.json(
      { status: "ok", ...scored, raw: { hasAccount: !!accountInfo, txCount: txs.length } },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
