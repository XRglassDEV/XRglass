// app/api/rpc/proxy/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://s1.ripple.com:51234",
  "https://rippled.xrpscan.com"
];

function getEndpoints() {
  const env = process.env.XRPL_RPC_ENDPOINTS;
  if (!env) {
    return DEFAULT_ENDPOINTS;
  }

  return env
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function forwardRpc<T extends Record<string, unknown>>(
  endpoint: string,
  method: string,
  params: unknown,
  timeoutMs = 15000
): Promise<T> {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method, params }),
      signal: ctrl.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = (await response.json().catch(() => null)) as unknown;
    if (!isRecord(json)) {
      throw new Error("Empty JSON response from RPC endpoint");
    }

    return json as T;
  } finally {
    clearTimeout(timeout);
  }
}

interface RpcProxyRequestBody {
  method?: unknown;
  params?: unknown;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as RpcProxyRequestBody | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { status: "error", message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const method = body.method;
    const params = body.params ?? [];

    if (typeof method !== "string") {
      return NextResponse.json(
        { status: "error", message: "Missing or invalid method" },
        { status: 400 }
      );
    }

    let lastErr: unknown = null;
    for (const endpoint of getEndpoints()) {
      try {
        const result = await forwardRpc<Record<string, unknown>>(endpoint, method, params);
        return NextResponse.json(
          { status: "ok", endpoint, result },
          { status: 200 }
        );
      } catch (error) {
        console.warn(
          `[rpc-proxy] RPC call failed via ${endpoint} for method ${method}:`,
          error
        );
        lastErr = error;
      }
    }

    return NextResponse.json(
      {
        status: "error",
        message: "All endpoints failed",
        error: lastErr instanceof Error ? lastErr.message : String(lastErr ?? "")
      },
      { status: 502 }
    );
  } catch (error) {
    console.error("[rpc-proxy] Unexpected error:", error);
    const message = error instanceof Error ? error.message : "unexpected";
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
