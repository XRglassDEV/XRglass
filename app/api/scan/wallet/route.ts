// app/api/scan/wallet/route.ts
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { computeWalletScore } from "../../../../lib/scoring-wallet";
import { fetchAccountInfo as fetchAccountInfoHttp } from "../../../../lib/xrpl-client";

// Allow override via env: comma-separated list
const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://xrpl.ws",
  "https://xrpl.link",
  "https://s1.ripple.com:51234",
  "https://xrpl.org/data/api/v1/",
  "https://rippled.xrpscan.com",
  "https://xrpl.node.robustwallet.io",
  "https://public.xrplnode.org:51234",
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

type RpcFallbackResult<T> = { endpoint: string; result: T };

async function rpcWithFallback<T=any>(body: any, endpoints = getRpcEndpoints()): Promise<RpcFallbackResult<T>> {
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const result = await rpcRequest<T>(ep, body);
      return { endpoint: ep, result };
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

    const endpoints = getRpcEndpoints();

    // 1) account_info
    const info = await fetchAccountInfoHttp(address, endpoints);

    const accountInfoResult = info?.data?.result ?? info?.data;
    const accountInfoData = accountInfoResult?.account_data ?? null;
    const accountInfoEndpoint = info?.endpoint ?? null;

    const infoMessageRaw = typeof info?.message === "string"
      ? info.message
      : typeof accountInfoResult?.error_message === "string"
        ? accountInfoResult.error_message
        : undefined;

    const errorFields = [
      accountInfoResult?.error,
      accountInfoResult?.error_message,
      infoMessageRaw,
    ]
      .filter((v) => typeof v === "string")
      .map((v) => (v as string).toLowerCase())
      .join(" ");

    const accountNotFound = /actnotfound|account not found/.test(errorFields);

    if (!info?.ok && !accountNotFound) {
      return NextResponse.json(
        {
          status: "error",
          message: infoMessageRaw ?? "Failed to fetch XRPL account info.",
          tried: info?.tried ?? endpoints,
        },
        { status: 504 }
      );
    }

    // 2) account_tx (last 20)
    let txs: any[] = [];
    let transactionsEndpoint: string | null = null;
    try {
      const txResponse = await rpcWithFallback({
        method: "account_tx",
        params: [{
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 20,
          forward: false
        }]
      }, endpoints);
      const resp: any = txResponse.result;
      transactionsEndpoint = txResponse.endpoint;
      txs = resp?.transactions || resp?.result?.transactions || [];
    } catch (e) {
      // Non-fatal
      txs = [];
    }

    const data = {
      address,
      accountInfo: accountInfoData ?? null,
      transactions: txs,
      fetchedAt: new Date().toISOString(),
    };

    const scored = computeWalletScore(data);
    const debug = {
      accountInfoNode: accountInfoEndpoint,
      transactionsNode: transactionsEndpoint,
      accountInfoStatus: info?.ok ? "ok" : accountNotFound ? "not_found" : infoMessageRaw ?? "unknown",
      accountInfoTried: info?.tried ?? endpoints,
    };
    return NextResponse.json(
      {
        status: "ok",
        ...scored,
        raw: { hasAccount: !!accountInfoData, txCount: txs.length },
        debug,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
