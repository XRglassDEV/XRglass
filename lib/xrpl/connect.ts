import xrpl from "xrpl";
import { XRPL_NODES } from "./nodes";

function withTimeout<T>(p: Promise<T>, ms = 6000) {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error.trim();
  return fallback;
}

export async function connectXRPL() {
  for (const node of XRPL_NODES) {
    try {
      const start = performance.now();
      const client = new xrpl.Client(node);
      await withTimeout(client.connect(), 5000);
      const latency = Math.round(performance.now() - start);
      return { client, node, latency } as const;
    } catch {
      // try next node
    }
  }
  throw new Error("all_nodes_failed");
}

export async function requestWithRetry<T = unknown>(
  make: (client: xrpl.Client) => Promise<T>,
): Promise<{ data?: T; node?: string; latency?: number; error?: string }> {
  try {
    const { client, node, latency } = await connectXRPL();
    try {
      const data = await withTimeout(make(client), 6000);
      return { data, node, latency };
    } catch (error: unknown) {
      return { error: errorMessage(error, "request_failed"), node, latency };
    } finally {
      await client.disconnect();
    }
  } catch (error: unknown) {
    return { error: errorMessage(error, "all_nodes_failed") };
  }
}
