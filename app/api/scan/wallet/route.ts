// app/api/scan/wallet/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  computeWalletScore,
  type WalletAccountInfo,
  type WalletScanInput,
  type WalletTransaction
} from "../../../../lib/scoring-wallet";

const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://s1.ripple.com:51234",
  "https://rippled.xrpscan.com"
];

type RpcParams = unknown;

type RpcRecord = Record<string, unknown>;

function getRpcEndpoints(): string[] {
  const env = process.env.XRPL_RPC_ENDPOINTS;
  if (!env) return DEFAULT_ENDPOINTS;
  return env
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is RpcRecord {
  return typeof value === "object" && value !== null;
}

function isLikelyXRPAddress(addr: string) {
  return typeof addr === "string" && /^r[1-9A-HJ-NP-Za-km-z]{24,35}$/.test(addr);
}

async function rpcRequest<T>(
  url: string,
  method: string,
  params: RpcParams,
  timeoutMs = 15000
): Promise<T> {
  const body = { method, params };
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const rawJson = (await res.json().catch(() => null)) as unknown;
    if (!isRecord(rawJson)) {
      throw new Error("Invalid JSON from RPC");
    }

    const result = rawJson.result;
    return (isRecord(result) ? (result as T) : (rawJson as T));
  } finally {
    clearTimeout(timeout);
  }
}

async function rpcWithFallback<T>(
  method: string,
  params: RpcParams,
  endpoints = getRpcEndpoints()
): Promise<T> {
  let lastErr: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const response = await rpcRequest<T>(endpoint, method, params, 15000);
      if (endpoints.length > 1) {
        console.info(
          `[wallet-scan] RPC request succeeded via ${endpoint} for method ${method}`
        );
      }
      return response;
    } catch (error) {
      console.warn(
        `[wallet-scan] RPC request failed via ${endpoint} for method ${method}:`,
        error
      );
      lastErr = error;
    }
  }

  throw lastErr || new Error("All RPC endpoints failed");
}

function extractTransactions(value: RpcRecord): WalletTransaction[] {
  if (Array.isArray(value.transactions)) {
    return value.transactions.filter(isRecord) as WalletTransaction[];
  }

  if (isRecord(value.result) && Array.isArray(value.result.transactions)) {
    return value.result.transactions.filter(isRecord) as WalletTransaction[];
  }

  return [];
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

    let accountInfo: WalletAccountInfo | null = null;
    try {
      accountInfo = await rpcWithFallback<WalletAccountInfo>("account_info", [
        { account: address, ledger_index: "validated" }
      ]);
    } catch (error) {
      console.error(
        `[wallet-scan] Failed to fetch account_info for ${address}:`,
        error
      );
      accountInfo = null;
    }

    let transactions: WalletTransaction[] = [];
    try {
      const txResp = await rpcWithFallback<RpcRecord>("account_tx", [
        {
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit: 20,
          forward: false
        }
      ]);

      transactions = extractTransactions(txResp);
    } catch (error) {
      console.error(
        `[wallet-scan] Failed to fetch account_tx for ${address}:`,
        error
      );
      transactions = [];
    }

    const data: WalletScanInput = {
      address,
      accountInfo,
      transactions,
      fetchedAt: new Date().toISOString()
    };

    const scored = computeWalletScore(data);

    return NextResponse.json(
      {
        status: "ok",
        debug: { triedEndpoints: getRpcEndpoints() },
        ...scored,
        raw: { hasAccount: !!accountInfo, txCount: transactions.length }
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[wallet-scan] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
