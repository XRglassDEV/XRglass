import { NextRequest } from "next/server";

import { rpcWithFallback } from "@/lib/xrpl/rpc";

type AccountLine = {
  account?: string;
  balance?: string | number;
  currency?: string;
};

type AccountLinesResult = {
  lines?: AccountLine[];
  marker?: unknown;
};

export const runtime = "edge";

/**
 * Body: { issuer: string, currency: string, topN?: number }
 * - issuer: XRPL account (r...)
 * - currency: 3-letter (e.g. "USD") or 40-hex uppercase code
 * Returns:
 *  - totalSupply: number
 *  - holdersCount: number
 *  - topHolders: Array<{ account: string, amount: number, percent: number }>
 *  - topNPercent: number
 *  - largestPercent: number
 */
export async function POST(req: NextRequest) {
  try {
    const { issuer, currency, topN = 10 } = await req.json();
    const iss = String(issuer || "").trim();
    const curRaw = String(currency || "").trim();
    if (!iss || !curRaw) {
      return new Response(JSON.stringify({ error: "issuer and currency are required" }), { status: 400 });
    }

    // Normalize currency comparison
    const isHexCurrency = /^[A-F0-9]{40}$/i.test(curRaw);
    const cur = isHexCurrency ? curRaw.toUpperCase() : curRaw.toUpperCase(); // XRPL uses uppercase codes

    const holders: { account: string; amount: number }[] = [];

    async function fetchLines(marker?: unknown): Promise<AccountLinesResult> {
      const params: Record<string, unknown> = {
        account: iss,
        ledger_index: "validated",
        limit: 400,
      };
      if (marker) params.marker = marker;
      const body = { method: "account_lines", params: [params] };
      const resp = await rpcWithFallback<AccountLinesResult>(() => body);
      if (resp.error || !resp.data) {
        throw new Error(resp.error || "rpc_failed");
      }
      return resp.data;
    }

    let marker: unknown | undefined;
    do {
      const page = await fetchLines(marker);
      const lines: AccountLine[] = Array.isArray(page?.lines) ? page.lines : [];
      marker = page?.marker;

      for (const line of lines) {
        const lineCur: string = String(line.currency || "").toUpperCase();
        if (lineCur !== cur) continue;

        const bal = parseFloat(String(line.balance || "0"));
        const owedToHolder = bal < 0 ? -bal : 0;
        if (owedToHolder > 0) {
          const holder = String(line.account || "").trim();
          holders.push({ account: holder, amount: owedToHolder });
        }
      }
    } while (marker);

    const map = new Map<string, number>();
    for (const h of holders) {
      map.set(h.account, (map.get(h.account) || 0) + h.amount);
    }
    const rows = Array.from(map.entries()).map(([account, amount]) => ({ account, amount }));

    const totalSupply = rows.reduce((a, r) => a + r.amount, 0);
    const holdersCount = rows.length;

    rows.sort((a, b) => b.amount - a.amount);
    const top = rows.slice(0, Math.max(1, Math.min(topN, rows.length)));
    const topSum = top.reduce((a, r) => a + r.amount, 0);
    const topNPercent = totalSupply > 0 ? (topSum / totalSupply) * 100 : 0;
    const largestPercent = totalSupply > 0 ? (top[0]?.amount / totalSupply) * 100 : 0;

    const topHolders = top.map((r) => ({
      account: r.account,
      amount: +r.amount.toFixed(6),
      percent: totalSupply > 0 ? +((r.amount / totalSupply) * 100).toFixed(2) : 0,
    }));

    return new Response(
      JSON.stringify({
        issuer: iss,
        currency: cur,
        totalSupply: +totalSupply.toFixed(6),
        holdersCount,
        topN: top.length,
        topHolders,
        topNPercent: +topNPercent.toFixed(2),
        largestPercent: +largestPercent.toFixed(2),
      }),
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error && err.message ? err.message : "metrics error";
    const status = message === "all_nodes_failed" ? 503 : 400;
    return new Response(JSON.stringify({ error: message }), { status });
  }
}
