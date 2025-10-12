export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { requestWithRetry } from "@/lib/xrpl/connect";

type AccountInfoPayload = {
  account_data: Record<string, unknown> | null;
  _notFound?: boolean;
};

type AccountInfoResult = {
  info: AccountInfoPayload;
};

function isActNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const data = (error as { data?: { error?: unknown } }).data;
  return typeof data === "object" && data !== null && (data as { error?: unknown }).error === "actNotFound";
}

function extractAccountInfo(response: unknown): AccountInfoPayload {
  if (
    typeof response === "object" &&
    response !== null &&
    "result" in response &&
    typeof (response as { result?: unknown }).result === "object" &&
    (response as { result?: unknown }).result !== null
  ) {
    const result = (response as { result?: { account_data?: unknown } }).result;
    const accountData = (result as { account_data?: unknown }).account_data;
    if (typeof accountData === "object" && accountData !== null) {
      return { account_data: accountData as Record<string, unknown> };
    }
  }
  return { account_data: null };
}

type Verdict = "green" | "orange" | "red";
function colorVerdict(points: number): Verdict {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json(
      { status: "error", message: "No address provided" },
      { status: 400 },
    );
  }

  const resp = await requestWithRetry<AccountInfoResult>(async (client) => {
    try {
      const infoResponse = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
        strict: true,
      });
      return { info: extractAccountInfo(infoResponse) };
    } catch (error) {
      if (isActNotFound(error)) {
        return { info: { account_data: null, _notFound: true } };
      }
      throw error;
    }
  });

  if (resp.error) {
    const isNetwork = resp.error === "all_nodes_failed" || resp.error === "timeout";
    return NextResponse.json(
      {
        status: "error",
        kind: isNetwork ? "network" : "unknown",
        message: isNetwork ? "All XRPL nodes failed to respond" : resp.error,
      },
      { status: 503 },
    );
  }

  const notFound = resp.data?.info._notFound;
  const info = resp.data?.info;

  if (notFound) {
    return NextResponse.json({
      status: "ok",
      verdict: "orange",
      reason: "Account not found",
      node: resp.node,
      latency: resp.latency,
    });
  }

  const points = info?.account_data ? 1 : 3;
  const verdict = colorVerdict(points);

  return NextResponse.json({
    status: "ok",
    verdict,
    node: resp.node,
    latency: resp.latency,
    account: info?.account_data ?? null,
  });
}
