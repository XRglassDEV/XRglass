export type RpcNode = { url: string; name: string };

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234/", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234/", name: "Ripple S2" },
  { url: "https://xrplcluster.com/",      name: "XRPL Cluster (HTTP)" }
];

async function postJSON(url: string, body: unknown, timeoutMs = 8000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "XRglass/1.0" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store"
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

type BodyFactory = () => unknown;

function resolveBody(body: unknown | BodyFactory): unknown {
  return typeof body === "function" ? (body as BodyFactory)() : body;
}

function orderNodes(preferred?: RpcNode): RpcNode[] {
  if (!preferred) return [...RPC_NODES];
  const nodes = [...RPC_NODES];
  const index = nodes.findIndex((node) => node.url === preferred.url);
  if (index === 0) {
    return nodes;
  }
  if (index > 0) {
    const [node] = nodes.splice(index, 1);
    nodes.unshift(node);
    return nodes;
  }
  return [preferred, ...nodes];
}

export async function rpcWithFallback<T = unknown>(
  body: unknown | BodyFactory,
  preferredNode?: RpcNode,
  timeoutMs = 8000
): Promise<{ data?: T; node?: RpcNode; latency?: number; error?: string }> {
  for (const node of orderNodes(preferredNode)) {
    const start = performance.now();
    try {
      const json = await postJSON(node.url, resolveBody(body), timeoutMs);
      const latency = Math.round(performance.now() - start);
      if (json?.result || json?.status === "success") {
        return { data: (json.result ?? json), node, latency };
      }
    } catch {
      continue;
    }
  }
  return { error: "all_nodes_failed" };
}

