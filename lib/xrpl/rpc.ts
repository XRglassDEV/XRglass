export type RpcNode = { url: string; name: string };

export const RPC_NODES: RpcNode[] = [
  { url: "https://s1.ripple.com:51234/", name: "Ripple S1" },
  { url: "https://s2.ripple.com:51234/", name: "Ripple S2" },
  { url: "https://xrplcluster.com/",      name: "XRPL Cluster (HTTP)" },
];

/** XRPL JSON-RPC envelope */
export type RpcEnvelope = {
  status?: "success" | "error" | string;
  result?: unknown;
  error?: unknown;
};

/** Narrow unknown to a plain object */
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

/** Type guard for RpcEnvelope */
function isEnvelope(x: unknown): x is RpcEnvelope {
  return isObject(x) && (
    "result" in x ||
    "status" in x ||
    "error" in x
  );
}

/** Parse JSON text into an RpcEnvelope (never throws) */
function parseEnvelope(text: string, httpStatus: number): RpcEnvelope {
  try {
    const json = JSON.parse(text);
    if (isEnvelope(json)) return json;
    // Non-envelope JSON
    return { status: "error", error: `non-envelope JSON (HTTP ${httpStatus})` };
  } catch {
    return { status: "error", error: `non-JSON (HTTP ${httpStatus})` };
  }
}

async function postJSON(
  url: string,
  body: unknown,
  timeoutMs = 8000
): Promise<RpcEnvelope> {
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

    const text = await r.text();
    const env = parseEnvelope(text, r.status);
    if (!r.ok && env.status !== "error") {
      // preserve server payload but reflect HTTP error
      return { ...env, status: "error", error: `HTTP ${r.status}` };
    }
    return env;
  } finally {
    clearTimeout(t);
  }
}

function unwrapResult<T = unknown>(env: RpcEnvelope): T | undefined {
  // success if we have a result OR explicit success status
  const hasResult = isObject(env) && "result" in env && env.result !== undefined;
  if (hasResult) return env.result as T;
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
      if (data !== undefined) {
        return { data, node, latency };
      }
      // try next node on error/malformed envelope
      continue;
    } catch {
      // network/abort/etc: try next node
      continue;
    }
  }
  return { error: "all_nodes_failed" };
}
