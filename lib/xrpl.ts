import { rpcWithFallback, rpcCall, type RpcNode } from "./xrpl/rpc";

type AccountInfoResponse = {
  account_data?: {
    Flags?: number;
    OwnerCount?: number | string;
    RegularKey?: string;
    Domain?: string | null;
    [key: string]: unknown;
  };
  error?: string;
  [key: string]: unknown;
};

type AccountLinesResponse = {
  lines?: Array<{
    account?: string;
    balance?: string;
    currency?: string;
  }>;
  marker?: unknown;
  error?: string;
  [key: string]: unknown;
};

export async function fetchAccountInfo(account: string) {
  const resp = await rpcWithFallback<AccountInfoResponse>(() => ({
    method: "account_info",
    params: [{ account, ledger_index: "validated", strict: true }],
  }));
  if (resp.error || !resp.data) {
    throw new Error(resp.error || "account_info_failed");
  }
  if (resp.data.error) {
    const code = resp.data.error || "account_info_error";
    const err = new Error(code);
    (err as { data?: AccountInfoResponse }).data = resp.data;
    throw err;
  }
  return resp.data;
}

export function hexToDomain(hex?: string) {
  if (!hex) return null;
  try {
    return Buffer.from(hex, "hex").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Decode important AccountRoot flag bits.
 * Docs (bits may change): lsfDisableMaster=0x00100000, lsfNoFreeze=0x00200000, lsfGlobalFreeze=0x00400000
 */
export function decodeAccountFlags(flags: number | undefined) {
  const f = flags ?? 0;
  const lsfDisableMaster = 0x00100000;
  const lsfNoFreeze = 0x00200000;
  const lsfGlobalFreeze = 0x00400000;
  return {
    masterDisabled: (f & lsfDisableMaster) === lsfDisableMaster,
    noFreeze: (f & lsfNoFreeze) === lsfNoFreeze,
    globalFreeze: (f & lsfGlobalFreeze) === lsfGlobalFreeze,
  };
}

/**
 * TransferRate: billionths. 1_000_000_000 = 0% fee. Above means fee.
 * Returns percentage as a number, e.g. 0, 0.5, 2.0, etc.
 */
export function calcTransferFeePct(transferRate?: number): number {
  const ONE_BILLION = 1_000_000_000;
  const r = transferRate ?? ONE_BILLION;
  const fee = r / ONE_BILLION - 1;
  return Math.max(0, fee * 100);
}

async function fetchAccountLines(
  issuer: string,
  node: RpcNode,
  marker?: unknown
) {
  const body = {
    method: "account_lines",
    params: [
      {
        account: issuer,
        ledger_index: "validated",
        limit: 400,
        ...(marker !== undefined ? { marker } : {}),
      },
    ],
  };
  return rpcCall<AccountLinesResponse>(node, body);
}

/**
 * Count trustlines to this account (as issuer). This is a simple popularity/dispersion proxy.
 */
export async function countTrustlines(issuer: string): Promise<number> {
  const first = await rpcWithFallback<AccountLinesResponse>(() => ({
    method: "account_lines",
    params: [{ account: issuer, ledger_index: "validated", limit: 400 }],
  }));

  if (first.error || !first.data || !first.node) {
    throw new Error(first.error || "account_lines_failed");
  }

  if (first.data.error) {
    const err = new Error(first.data.error || "account_lines_error");
    (err as { data?: AccountLinesResponse }).data = first.data;
    throw err;
  }

  let total = Array.isArray(first.data.lines) ? first.data.lines.length : 0;
  let marker = first.data.marker;
  const node = first.node;

  while (marker !== undefined && marker !== null) {
    const next = await fetchAccountLines(issuer, node, marker);
    if (next.error || !next.data) {
      throw new Error(next.error || "account_lines_failed");
    }
    if (next.data.error) {
      const err = new Error(next.data.error || "account_lines_error");
      (err as { data?: AccountLinesResponse }).data = next.data;
      throw err;
    }
    total += Array.isArray(next.data.lines) ? next.data.lines.length : 0;
    marker = next.data.marker;
  }

  return total;
}
