export type RpcNode = { url: string; name: string };

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234/", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234/", name: "Ripple S2" },
  { url: "https://xrplcluster.com/",      name: "XRPL Cluster (HTTP)" },
];

type RpcEnvelope = {
  status?: "success" | "error" | string;
  result?: any;     // XRPL JSON-RPC returns the payload under `result`
  error?: any;      // when not successful
};

async function postJSON(url: string, body: any, timeoutMs = 8000): Promise<RpcEnvelope> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "XRglass/1.0",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    // we always attempt to parse JSON; if not JSON, throw with HTTP code
    const text = await r.text();
    let json: RpcEnvelope;
    try {
      json = JSON.parse(text) as RpcEnvelope;
    } catch {
      throw new Error(`HTTP ${r.status} (non-JSON)`);
    }
    if (!r.ok) {
      // bubble up an error envelope so callers can continue to next node
      return json.status ? json : { status: "error", error: `HTTP ${r.status}` };
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

function unwrapResult<T = any>(env: RpcEnvelope): T | undefined {
  if (!env) return undefined;
  // XRPL servers typically return { status: "success", result: {...} }
  if (env.result !== undefined) return env.result as T;
  if (env.status === "success") return (env as unknown as T);
  return undefined;
}

export async function rpcWithFallback<T = any>(
  makeBody: () => any
): Promise<{ data?: T; node?: RpcNode; latency?: number; error?: string }> {
  for (const node of RPC_NODES) {
    const start = performance.now();
    try {
      const env = await postJSON(node.url, makeBody());
      const latency = Math.round(performance.now() - start);
      const data = unwrapResult<T>(env);
      if (data !== undefined) {
        return { data, node, latency };
      }
      // if server responded with explicit error, try next node
      continue;
    } catch {
      // network/parse/timeout: try next node
      continue;
    }
  }
  return { error: "all_nodes_failed" };
}
