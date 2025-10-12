export type RpcNode = { url: string; name: string };

export type RpcRequestBody = {
  method: string;
  params?: unknown[];
  [key: string]: unknown;
};

export type RpcResult<T> = {
  data?: T;
  node?: RpcNode;
  latency?: number;
  error?: string;
};

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234", name: "Ripple S2" },
  { url: "https://xrplcluster.com", name: "XRPL Cluster (HTTP)" },
];

async function postJSON(url: string, body: RpcRequestBody, timeoutMs = 6000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

type RpcPayload = {
  result?: unknown;
  status?: unknown;
};

type RpcErrorWithLatency = Error & { latency?: number };

function isSuccessPayload(json: unknown): json is RpcPayload {
  if (typeof json !== "object" || json === null) return false;
  const payload = json as RpcPayload;
  return payload.result !== undefined || payload.status === "success";
}

async function requestNode<T>(node: RpcNode, body: RpcRequestBody, timeoutMs = 6000) {
  const start = performance.now();
  const json = await postJSON(node.url, body, timeoutMs);
  const latency = Math.round(performance.now() - start);
  if (isSuccessPayload(json)) {
    const payload = (json as { result?: T }).result ?? (json as T);
    return { data: payload as T, latency };
  }
  const error: RpcErrorWithLatency = new Error("rpc_bad_response");
  error.latency = latency;
  throw error;
}

export async function rpcWithFallback<T = unknown>(
  makeBody: () => RpcRequestBody
): Promise<RpcResult<T>> {
  for (const node of RPC_NODES) {
    try {
      const { data, latency } = await requestNode<T>(node, makeBody());
      return { data, node, latency };
    } catch (error: unknown) {
      // try next node
      void error;
    }
  }
  return { error: "all_nodes_failed" };
}

export async function rpcCall<T = unknown>(
  node: RpcNode,
  body: RpcRequestBody,
  timeoutMs = 6000
): Promise<RpcResult<T> & { node: RpcNode }> {
  try {
    const { data, latency } = await requestNode<T>(node, body, timeoutMs);
    return { data, node, latency };
  } catch (error: unknown) {
    const latency =
      typeof (error as RpcErrorWithLatency | undefined)?.latency === "number"
        ? (error as RpcErrorWithLatency).latency
        : undefined;
    const message =
      typeof (error as { message?: unknown } | undefined)?.message === "string"
        ? (error as { message: string }).message
        : "rpc_request_failed";
    return { error: message, node, latency };
  }
}
