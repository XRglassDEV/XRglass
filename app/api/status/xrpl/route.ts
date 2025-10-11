export const runtime = "nodejs";
import { NextResponse } from "next/server";

const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://xrpl.ws",
  "https://xrpl.link",
  "https://s1.ripple.com:51234",
  "https://rippled.xrpscan.com",
  "https://public.xrplnode.org:51234"
];

async function ping(url: string, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ method: "server_info", params: [{}] }),
      signal: ctrl.signal
    });
    const ms = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { result?: unknown; info?: unknown; status?: string };
    const ok = Boolean(json.result || json.info || json.status === "success");
    return { url, ok, ms };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { url, ok: false, ms: Date.now() - start, error: message };
  } finally {
    clearTimeout(t);
  }
}

export async function GET() {
  const env = (process.env.XRPL_RPC_ENDPOINTS || "").split(",").map(s => s.trim()).filter(Boolean);
  const list = env.length ? env : DEFAULT_ENDPOINTS;
  const tests = await Promise.all(list.map((u) => ping(u)));
  const good = tests.filter(t => t.ok).sort((a, b) => a.ms - b.ms);
  const best = good[0] || null;
  return NextResponse.json({
    status: "ok",
    best,
    tests
  }, { status: 200 });
}
