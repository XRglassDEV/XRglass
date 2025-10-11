import { Client } from "xrpl";

import type { XrplNode } from "./nodes";

export type ProbeNodeOptions = {
  timeoutMs?: number;
};

export type NodeProbeSuccess = {
  node: XrplNode;
  ok: true;
  latencyMs: number;
  serverState?: string | null;
  buildVersion?: string | null;
  validatedLedger?: number | null;
};

export type NodeProbeFailure = {
  node: XrplNode;
  ok: false;
  latencyMs?: number;
  error: string;
};

export type NodeProbeResult = NodeProbeSuccess | NodeProbeFailure;

export type XrplStatusPayload = {
  ok: boolean;
  generatedAt: number;
  total: number;
  online: number;
  nodes: NodeProbeResult[];
};

function parseLedgerSequence(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function describeError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error) {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export async function probeNode(
  node: XrplNode,
  options: ProbeNodeOptions = {},
): Promise<NodeProbeResult> {
  const startedAt = Date.now();
  const timeout = options.timeoutMs ?? 6000;
  const client = new Client(node.url, {
    connectionTimeout: timeout,
    requestTimeout: timeout,
    maxSocketIdleTime: timeout,
  });

  try {
    await client.connect();
    const info = await client.request({ command: "server_info" });
    const latencyMs = Math.max(Date.now() - startedAt, 0);

    const details = typeof info === "object" && info && "result" in info ? (info as { result?: unknown }).result : null;
    const innerInfo =
      details &&
      typeof details === "object" &&
      details !== null &&
      "info" in details &&
      typeof (details as { info?: unknown }).info === "object"
        ? ((details as { info: Record<string, unknown> }).info ?? null)
        : null;

    const validatedLedger =
      innerInfo &&
      typeof innerInfo === "object" &&
      innerInfo !== null &&
      "validated_ledger" in innerInfo &&
      typeof (innerInfo as { validated_ledger?: unknown }).validated_ledger === "object"
        ? parseLedgerSequence(
            (innerInfo as { validated_ledger: { seq?: unknown; sequence?: unknown } }).validated_ledger.seq ??
              (innerInfo as { validated_ledger: { seq?: unknown; sequence?: unknown } }).validated_ledger.sequence,
          )
        : null;

    const serverState =
      innerInfo && typeof innerInfo === "object" && innerInfo !== null && "server_state" in innerInfo
        ? ((innerInfo as { server_state?: unknown }).server_state as string | undefined)
        : null;

    const buildVersion =
      innerInfo && typeof innerInfo === "object" && innerInfo !== null && "build_version" in innerInfo
        ? ((innerInfo as { build_version?: unknown }).build_version as string | undefined)
        : null;

    return {
      node,
      ok: true,
      latencyMs,
      serverState: serverState ?? null,
      buildVersion: buildVersion ?? null,
      validatedLedger,
    } satisfies NodeProbeSuccess;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    return {
      node,
      ok: false,
      latencyMs: latencyMs > 0 ? latencyMs : undefined,
      error: describeError(error),
    } satisfies NodeProbeFailure;
  } finally {
    try {
      await client.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
}

export function summarizeProbe(results: NodeProbeResult[]): XrplStatusPayload {
  const online = results.filter((result) => result.ok).length;
  return {
    ok: online > 0,
    generatedAt: Date.now(),
    total: results.length,
    online,
    nodes: results,
  };
}
