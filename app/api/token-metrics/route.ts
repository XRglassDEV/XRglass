import { NextRequest } from "next/server";

import { rpcWithFallback, rpcCall } from "@/lib/xrpl/rpc";

export const runtime = "edge";

type AccountLinesParams = {
  account: string;
  ledger_index: string;
  limit: number;
  marker?: unknown;
};

type AccountLinesResult = {
  lines?: Array<{
    currency?: string;
    balance?: string;
    account?: string;
  }>;
  marker?: unknown;
  error?: string;
  error_code?: number;
};

function makeAccountLinesBody(issuer: string, marker?: unknown) {
  const params: AccountLinesParams = {
    account: issuer,
    ledger_index: "validated",
    limit: 400,
  };
  if (marker !== undefined) {
    params.marker = marker;
  }
  return {
    method: "account_lines",
    params: [params],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { issuer, currency, topN = 10 } = await req.json();
    const iss = String(issuer || "").trim();
    const curRaw = String(currency || "").trim();
    if (!iss || !curRaw) {
      return new Response(JSON.stringify({ error: "issuer and currency are required" }), {
        status: 400,
      });
    }

    const cur = curRaw.toUpperCase();

    const firstResp = await rpcWithFallback<AccountLinesResult>(() => makeAccountLinesBody(iss));
    if (firstResp.error || !firstResp.data) {
      const message = firstResp.error || "Failed to fetch trustlines";
      const status = firstResp.error === "all_nodes_failed" ? 503 : 502;
      return new Response(JSON.stringify({ error: message }), { status });
    }

    if (firstResp.data.error) {
      return new Response(
        JSON.stringify({ error: firstResp.data.error, code: firstResp.data.error_code }),
        { status: 400 }
      );
    }

    const node = firstResp.node;
    if (!node) {
      return new Response(JSON.stringify({ error: "No XRPL node available" }), { status: 502 });
    }

    const holders: { account: string; amount: number }[] = [];

    const processLines = (lines: AccountLinesResult["lines"]) => {
      for (const line of lines ?? []) {
        const lineCur = String(line.currency || "").toUpperCase();
        if (lineCur !== cur) continue;

        const bal = parseFloat(String(line.balance || "0"));
        const owedToHolder = bal < 0 ? -bal : 0;
        if (owedToHolder > 0) {
          const holder = String(line.account || "").trim();
          holders.push({ account: holder, amount: owedToHolder });
        }
      }
    };

    processLines(firstResp.data.lines);

    let marker = firstResp.data.marker;

    while (marker !== undefined && marker !== null) {
      const nextResp = await rpcCall<AccountLinesResult>(node, makeAccountLinesBody(iss, marker));
      if (nextResp.error || !nextResp.data) {
        const message = nextResp.error || "Failed to fetch trustlines";
        return new Response(JSON.stringify({ error: message }), { status: 502 });
      }
      if (nextResp.data.error) {
        return new Response(
          JSON.stringify({ error: nextResp.data.error, code: nextResp.data.error_code }),
          { status: 400 }
        );
      }
      processLines(nextResp.data.lines);
      marker = nextResp.data.marker;
    }

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
  } catch (error: unknown) {
    const message =
      typeof (error as { message?: unknown } | undefined)?.message === "string"
        ? (error as { message: string }).message
        : "metrics error";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
