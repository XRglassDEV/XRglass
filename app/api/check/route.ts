// app/api/check/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { Client } from "xrpl";

import { ScoreResult, Reason as NormReason } from "@/lib/score";
import type { ApiResponse, ApiOk, ApiErr, Verdict as ApiVerdict } from "@/types/api";

const XRPL_ENDPOINT = "wss://s1.ripple.com";
const TRUSTED_WALLETS = new Set<string>([
  "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh", // Ripple donation
]);

const FLAGS = {
  lsfRequireDestTag: 0x00020000,
  lsfRequireAuth: 0x00040000,
  lsfDisallowXRP: 0x00080000,
  lsfDisableMaster: 0x00100000,
  lsfNoFreeze: 0x00200000,
  lsfGlobalFreeze: 0x00400000,
  lsfDefaultRipple: 0x00800000,
  lsfDepositAuth: 0x01000000,
} as const;

const DISCLAIMER =
  "Results are indicative only. XRglass cannot guarantee 100% safety.";

type Verdict = Extract<ApiVerdict, "green" | "orange" | "red">;

type FlagsDecoded = {
  RequireDestTag: boolean;
  RequireAuth: boolean;
  DisallowXRP: boolean;
  DisableMaster: boolean;
  NoFreeze: boolean;
  GlobalFreeze: boolean;
  DefaultRipple: boolean;
  DepositAuth: boolean;
};

type AccountDetails = {
  address: string;
  ownerCount: number;
  accountAgeDays: number | null;
  domain: string | null;
  tomlFound: boolean;
  addressListed: boolean;
  flagsDecoded: FlagsDecoded;
  regularKeySet: boolean;
};

type NotFoundDetails = {
  address: string;
  notFound: true;
};

type AccountInfoResponse = {
  result: {
    account_data: {
      Flags?: number;
      OwnerCount?: number | string;
      RegularKey?: string;
      Domain?: string | null;
    };
  };
};

type AccountTxItem = {
  tx?: { ledger_index?: number };
  ledger_index?: number;
};

type AccountTxResponse = {
  result: {
    transactions: AccountTxItem[];
  };
};

type LedgerResponse = {
  result: {
    ledger?: {
      close_time?: number;
    };
  };
};

function ok(
  verdict: Verdict,
  extra: Omit<ApiOk, "status" | "verdict"> = {}
): ApiOk {
  return { status: "ok", verdict, ...extra };
}

function err(message: string, code?: string): ApiErr {
  return { status: "error", message, code };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 10_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function colorVerdict(points: number): Verdict {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

function hasFlag(flags: number | undefined, bit: number): boolean {
  return typeof flags === "number" && (flags & bit) === bit;
}

function hexToAscii(hex?: string | null): string | null {
  if (!hex) return null;
  try {
    const bytes = hex.match(/.{1,2}/g) ?? [];
    return decodeURIComponent(bytes.map((b) => `%${b}`).join("")).replace(/\0+$/, "");
  } catch {
    try {
      return Buffer.from(hex, "hex").toString("utf8").replace(/\0+$/, "");
    } catch {
      return null;
    }
  }
}

function toNormReason(label: string, impact: number): NormReason {
  const code =
    label
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 32) || "REASON";
  return { code, label, weight: -impact };
}

function isAccountInfoResponse(value: unknown): value is AccountInfoResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "result" in value &&
    typeof (value as { result?: unknown }).result === "object" &&
    (value as AccountInfoResponse).result?.account_data !== undefined
  );
}

function isAccountTxResponse(value: unknown): value is AccountTxResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as AccountTxResponse).result?.transactions)
  );
}

function isLedgerResponse(value: unknown): value is LedgerResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LedgerResponse).result?.ledger === "object"
  );
}

function parseXrplErrorCode(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: { error?: unknown } }).data?.error === "string"
  ) {
    return (error as { data: { error: string } }).data.error;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return null;
}

async function getAccountAgeDays(client: Client, address: string): Promise<number | null> {
  try {
    const txResponse = await client.request({
      command: "account_tx",
      account: address,
      ledger_index_min: -1,
      ledger_index_max: -1,
      forward: true,
      limit: 1,
    });

    if (!isAccountTxResponse(txResponse)) {
      return null;
    }

    const first = txResponse.result.transactions[0];
    if (!first) return null;

    const txLedgerIndex =
      typeof first.tx === "object" &&
      first.tx !== null &&
      typeof (first.tx as { ledger_index?: unknown }).ledger_index === "number"
        ? (first.tx as { ledger_index: number }).ledger_index
        : null;

    const ledgerIndex =
      typeof first.ledger_index === "number" ? first.ledger_index : txLedgerIndex;

    if (ledgerIndex === null) return null;

    const ledgerResponse = await client.request({
      command: "ledger",
      ledger_index: ledgerIndex,
      transactions: false,
      expand: false,
    });

    if (!isLedgerResponse(ledgerResponse)) {
      return null;
    }

    const closeTime = ledgerResponse.result.ledger?.close_time;
    if (typeof closeTime !== "number") return null;

    const rippleEpochMs = (closeTime + 946_684_800) * 1000;
    const ageMs = Date.now() - rippleEpochMs;
    return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  } catch {
    return null;
  }
}

async function checkXrpToml(address: string, domainHex?: string | null) {
  const domain = hexToAscii(domainHex)?.trim().replace(/\/+$/, "") || null;
  if (!domain) {
    return { domain: null, tomlFound: false, addressListed: false };
  }

  const urls = [
    `https://${domain}/.well-known/xrp.toml`,
    `https://www.${domain}/.well-known/xrp.toml`,
  ];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: {
          "User-Agent": "XRglass/1.0 (+https://xtrustscore.com)",
          Accept: "text/plain,*/*",
        },
      });
      if (!res.ok) continue;
      const text = await res.text();
      const addressListed = text.includes(address);
      return { domain, tomlFound: true, addressListed };
    } catch {
      // ignore and try next URL
    }
  }

  return { domain, tomlFound: false, addressListed: false };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const addressRaw = searchParams.get("address");
  const address = addressRaw?.trim();

  if (!address) {
    return NextResponse.json<ApiResponse>(err("No address provided"), {
      status: 400,
    });
  }

  let client: Client | null = null;

  try {
    client = new Client(XRPL_ENDPOINT);
    await client.connect();

    let accountData: AccountInfoResponse["result"]["account_data"];
    try {
      const info = await client.request({
        command: "account_info",
        account: address,
        ledger_index: "validated",
        strict: true,
      });

      if (!isAccountInfoResponse(info)) {
        return NextResponse.json<ApiResponse>(err("Account lookup failed"), {
          status: 502,
        });
      }

      accountData = info.result.account_data;
    } catch (error) {
      const code = parseXrplErrorCode(error) ?? undefined;
      if (code && /accountMalformed|actMalformed/i.test(code)) {
        return NextResponse.json<ApiResponse>(err("Invalid XRP address", code), {
          status: 400,
        });
      }
      if (code && /actNotFound|account not found/i.test(code)) {
        const reasons = [
          { label: "Account not found (not activated/funded)", impact: 4 },
        ];
        const notFoundDetails: NotFoundDetails = { address, notFound: true };
        const normalized: ScoreResult<{ address: string }> = {
          verdict: "red",
          score: 4,
          reasons: reasons.map((r) => toNormReason(r.label, r.impact)),
          subject: { address },
          badges: ["Account not found"],
          ts: new Date().toISOString(),
        };

        return NextResponse.json<ApiResponse>(
          ok("red", {
            points: 4,
            reasons,
            details: notFoundDetails,
            disclaimer: DISCLAIMER,
            normalized,
          }),
          { status: 200 }
        );
      }

      return NextResponse.json<ApiResponse>(
        err("Failed to retrieve account information", code),
        { status: 502 }
      );
    }

    const flags = typeof accountData.Flags === "number" ? accountData.Flags : undefined;
    const ownerCount = Number(accountData.OwnerCount ?? 0);
    const regKey = typeof accountData.RegularKey === "string" ? accountData.RegularKey : undefined;
    const domainHex = typeof accountData.Domain === "string" ? accountData.Domain : null;

    const { domain, tomlFound, addressListed } = await checkXrpToml(address, domainHex);
    const accountAgeDays = await getAccountAgeDays(client, address);

    const flagsDecoded: FlagsDecoded = {
      RequireDestTag: hasFlag(flags, FLAGS.lsfRequireDestTag),
      RequireAuth: hasFlag(flags, FLAGS.lsfRequireAuth),
      DisallowXRP: hasFlag(flags, FLAGS.lsfDisallowXRP),
      DisableMaster: hasFlag(flags, FLAGS.lsfDisableMaster),
      NoFreeze: hasFlag(flags, FLAGS.lsfNoFreeze),
      GlobalFreeze: hasFlag(flags, FLAGS.lsfGlobalFreeze),
      DefaultRipple: hasFlag(flags, FLAGS.lsfDefaultRipple),
      DepositAuth: hasFlag(flags, FLAGS.lsfDepositAuth),
    };

    const baseDetails: AccountDetails = {
      address,
      ownerCount,
      accountAgeDays,
      domain,
      tomlFound,
      addressListed,
      flagsDecoded,
      regularKeySet: Boolean(regKey),
    };

    if (TRUSTED_WALLETS.has(address)) {
      const reasons = [{ label: "Trusted allowlist wallet", impact: -999 }];
      const normalized: ScoreResult<{ address: string }> = {
        verdict: "green",
        score: 0,
        reasons: reasons.map((r) => toNormReason(r.label, r.impact)),
        subject: { address },
        badges: ["Trusted wallet", "Allowlist match"],
        ts: new Date().toISOString(),
      };

      return NextResponse.json<ApiResponse>(
        ok("green", {
          points: 0,
          reasons,
          details: baseDetails,
          disclaimer: DISCLAIMER,
          normalized,
        }),
        { status: 200 }
      );
    }

    let points = 0;
    const reasons: Array<{ label: string; impact: number }> = [];
    const badges: string[] = [];

    if (flagsDecoded.GlobalFreeze) {
      points += 3;
      reasons.push({ label: "Account has GlobalFreeze set", impact: 3 });
      badges.push("GlobalFreeze");
    }

    if (flagsDecoded.DisableMaster && !regKey) {
      points += 2;
      reasons.push({ label: "Master key disabled without RegularKey", impact: 2 });
      badges.push("Master disabled (no RegularKey)");
    }

    if (accountAgeDays !== null) {
      if (accountAgeDays < 7) {
        points += 2;
        reasons.push({ label: "Account age < 7 days", impact: 2 });
      } else if (accountAgeDays < 30) {
        points += 1;
        reasons.push({ label: "Account age < 30 days", impact: 1 });
      }
    }

    if (ownerCount > 20) {
      points += 1;
      reasons.push({ label: "High OwnerCount (>20)", impact: 1 });
    }

    if (domain) {
      if (tomlFound) {
        points -= 1;
        reasons.push({ label: "xrp.toml found on domain", impact: -1 });
        badges.push("xrp.toml");
        if (addressListed) {
          points -= 1;
          reasons.push({ label: "Address listed in xrp.toml", impact: -1 });
          badges.push("TOML-listed");
        }
      } else {
        reasons.push({ label: "Domain set but xrp.toml not found", impact: 0 });
      }
    } else {
      reasons.push({ label: "No domain configured", impact: 0 });
    }

    if (flagsDecoded.RequireDestTag) {
      points -= 1;
      reasons.push({ label: "RequireDestTag enabled", impact: -1 });
      badges.push("RequireDestTag");
    }

    const verdict = colorVerdict(points);

    const normalized: ScoreResult<{ address: string }> = {
      verdict,
      score: points,
      reasons: reasons.map((r) => toNormReason(r.label, r.impact)),
      subject: { address },
      badges,
      ts: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse>(
      ok(verdict, {
        points,
        reasons,
        details: baseDetails,
        disclaimer: DISCLAIMER,
        normalized,
      }),
      { status: 200 }
    );
  } catch (error) {
    const code = parseXrplErrorCode(error) ?? undefined;
    return NextResponse.json<ApiResponse>(err("Internal server error", code), {
      status: 500,
    });
  } finally {
    try {
      await client?.disconnect();
    } catch {
      // ignore disconnect errors
    }
  }
}
