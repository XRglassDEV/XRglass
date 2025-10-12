export type RpcNode = { url: string; name: string };

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234/", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234/", name: "Ripple S2" },
  { url: "https://xrplcluster.com/",      name: "XRPL Cluster (HTTP)" },
];

async function postJSON(url: string, body: unknown, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "XRglass/1.0" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });

    // Parse as ANY on purpose to avoid TS '{}' property errors in CI
    try {
      const json: any = await res.json();
      // attach http status if server didn't give JSON
      if (!res.ok && (json == null || typeof json !== "object")) {
        return { httpStatus: res.status };
      }
      return json;
    } catch {
      const text = await res.text().catch(() => "");
      return text ? { httpStatus: res.status, body: text } : { httpStatus: res.status };
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Call XRPL HTTP JSON-RPC across fallback nodes.
 * Returns the raw JSON from the first node that responds (no shape assumptions).
 */
export async function rpcWithFallback<T = unknown>(
  makeBody: () => unknown
): Promise<{ data?: T; node?: RpcNode; latency?: number; error?: string }> {
  for (const node of RPC_NODES) {
    const start = performance.now();
    try {
      const data: any = await postJSON(node.url, makeBody());
      const latency = Math.round(performance.now() - start);
      return { data: data as T, node, latency };
    } catch {
      // try the next node
      continue;
    }
  }
  return { error: "all_nodes_failed" };
}
