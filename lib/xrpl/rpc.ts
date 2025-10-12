export type RpcNode = { url: string; name: string };

export type RpcSuccess<T> = {
  data: T;
  node: RpcNode;
  latency: number;
  error?: undefined;
};

export type RpcFailure = {
  data?: undefined;
  node?: undefined;
  latency?: undefined;
  error: "all_nodes_failed";
};

export type RpcResult<T> = RpcSuccess<T> | RpcFailure;

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234/", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234/", name: "Ripple S2" },
  { url: "https://xrplcluster.com/", name: "XRPL Cluster (HTTP)" },
];

type RpcEnvelope<T> = {
  result?: T;
  status?: string;
} & Record<string, unknown>;

async function postJSON<T>(
  url: string,
  body: unknown,
  timeoutMs = 8000
): Promise<RpcEnvelope<T>> {
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
    return (await r.json()) as RpcEnvelope<T>;
  } finally {
    clearTimeout(t);
  }
}

export async function rpcWithFallback<T = unknown>(
  makeBody: () => unknown
): Promise<RpcResult<T>> {
  for (const node of RPC_NODES) {
    const start = performance.now();
    try {
      const json = await postJSON<T>(node.url, makeBody());
      const latency = Math.round(performance.now() - start);
      if (json?.result || json?.status === "success") {
        return { data: (json.result ?? (json as unknown)) as T, node, latency };
      }
    } catch {
      continue;
    }
  }
  return { error: "all_nodes_failed" };
}

export async function rpcCall<T = unknown>(
  node: RpcNode,
  body: unknown,
  timeoutMs = 8000
): Promise<T> {
  const json = await postJSON<T>(node.url, body, timeoutMs);
  return (json?.result ?? (json as unknown)) as T;
}
