export type RpcNode = { url: string; name: string };

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234/", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234/", name: "Ripple S2" },
  { url: "https://xrplcluster.com/",      name: "XRPL Cluster (HTTP)" },
];

async function postJSON(url: string, body: unknown, timeoutMs = 8000): Promise<any> {
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
    // Parse as ANY on purpose to avoid TS '{}' property errors in CI
    const json: any = await r.json().catch(async () => {
      const text = await r.text().catch(() => "");
      return { status: "error", error: text || `HTTP ${r.status}` };
    });
    if (!r.ok) {
      if (!json || typeof json !== "object") return { status: "error", error: `HTTP ${r.status}` };
      if (!("status" in json)) json.status = "error";
      if (!("error" in json))  json.error  = `HTTP ${r.status}`;
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

export async function rpcWithFallback<T = unknown>(
  makeBody: () => unknown
): Promise<{ data?: T; node?: RpcNode; latency?: number; error?: string }> {
  for (const node of RPC_NODES) {
    const start = performance.now();
    try {
      const env: any = await postJSON(node.url, makeBody());
      const latency = Math.round(performance.now() - start);

      // Prefer 'result' if present, else accept whole object on explicit success
      if (env && typeof env === "object" && "result" in env) {
        return { data: (env.result as T), node, latency };
      }
      if (env && env.status === "success") {
        return { data: (env as T), node, latency };
      }
      // else try next node
      continue;
    } catch {
      continue;
    }
  }
  return { error: "all_nodes_failed" };
}
