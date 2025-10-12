export type RpcNode = { url: string; name: string };

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234/", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234/", name: "Ripple S2" },
  { url: "https://xrplcluster.com/",      name: "XRPL Cluster (HTTP)" },
];

export type RpcEnvelope = {
  status?: string;   // "success" | "error" | others
  result?: unknown;  // payload
  error?: unknown;   // server/transport error
};

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function buildEnvelope(from: unknown): RpcEnvelope {
  const env: RpcEnvelope = {};
  if (isObject(from)) {
    if ("status" in from) env.status = String((from as any).status);
    if ("result" in from) env.result = (from as any).result;
    if ("error"  in from) env.error  = (from as any).error;
  }
  return env;
}

async function postJSON(url: string, body: unknown, timeoutMs = 8000): Promise<RpcEnvelope> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "XRglass/1.0" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });

    const text = await r.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = { error: `non-JSON (HTTP ${r.status})` }; }

    const env = buildEnvelope(parsed);

    // reflect HTTP errors even if server didn't set status/error
    if (!r.ok) {
      if (!env.status) env.status = "error";
      if (!env.error)  env.error  = `HTTP ${r.status}`;
    }
    return env;
  } finally {
    clearTimeout(t);
  }
}

function unwrapResult<T = unknown>(env: RpcEnvelope): T | undefined {
  if (env.result !== undefined) return env.result as T;
  if (env.status === "success") return (env as unknown as T);
  return undefined;
}

export async function rpcWithFallback<T = unknown>(
  makeBody: () => unknown
): Promise<{ data?: T; node?: RpcNode; latency?: number; error?: string }> {
  for (const node of RPC_NODES) {
    const start = performance.now();
    try {
      const env = await postJSON(node.url, makeBody());
      const latency = Math.round(performance.now() - start);
      const data = unwrapResult<T>(env);
      if (data !== undefined) return { data, node, latency };
      // if we got an envelope but no data, try next node
      continue;
    } catch {
      // network/abort/etc — try next node
      continue;
    }
  }
  return { error: "all_nodes_failed" };
}
