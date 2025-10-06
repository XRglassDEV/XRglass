// app/api/check/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { Client } from "xrpl";

import { ScoreResult, Reason as NormReason, verdictFromScore } from "@/lib/score";

// ---- Your existing types ----
type Verdict = "green" | "orange" | "red";

// ---- Helpers you already have ----
function colorVerdict(points: number): Verdict {
  if (points <= 1) return "green";
  if (points <= 3) return "orange";
  return "red";
}

// Known-trusted allowlist
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
};

const hasFlag = (flags: number | undefined, bit: number) =>
  typeof flags === "number" && (flags & bit) === bit;

function hexToAscii(hex?: string | null): string | null {
  if (!hex) return null;
  try {
    const bytes = hex.match(/.{1,2}/g) || [];
    return decodeURIComponent(bytes.map((b) => "%" + b).join("")).replace(/\0+$/, "");
  } catch {
    try {
      return Buffer.from(hex, "hex").toString("utf8").replace(/\0+$/, "");
    } catch {
      return null;
    }
  }
}

async function fetchWithTimeout(url: string, ms = 3500): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "XRglass/1.0 (+https://xtrustscore.com)", Accept: "text/plain,*/*" },
    });
  } finally {
    clearTimeout(id);
  }
}

async function getAccountInfo(client: Client, address: string) {
  const r = await client.request({
    command: "account_info",
    account: address,
    ledger_index: "validated",
    strict: true,
  });
  return r as any;
}

async function getAccountAgeDays(client: Client, address: string): Promise<number | null> {
  try {
    const r = await client.request({
      command: "account_tx",
      account: address,
      ledger_index_min: -1,
      ledger_index_max: -1,
      forward: true,
      limit: 1,
    });
    const txs = (r as any).result?.transactions || [];
    if (!txs.length) return null;
    const first = txs[0];
    const ledgerIndex = first.tx?.ledger_index ?? first.ledger_index;
    if (!ledgerIndex) return null;

    const ledger = await client.request({
      command: "ledger",
      ledger_index: ledgerIndex,
      transactions: false,
      expand: false,
    });
    const closeTime = (ledger as any).result?.ledger?.close_time;
    if (typeof closeTime !== "number") return null;
    const rippleEpochMs = (closeTime + 946684800) * 1000;
    const ageMs = Date.now() - rippleEpochMs;
    return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
  } catch {
    return null;
  }
}

async function checkXrpToml(address: string, domainHex?: string | null) {
  const domain = hexToAscii(domainHex)?.trim().replace(/\/+$/, "") || null;
  if (!domain) return { domain: null, tomlFound: false, addressListed: false };

  const urls = [
    `https://${domain}/.well-known/xrp.toml`,
    `https://www.${domain}/.well-known/xrp.toml`,
  ];

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, 3500);
      if (!res.ok) continue;
      const text = await res.text();
      const addressListed = text.includes(address);
      return { domain, tomlFound: true, addressListed };
    } catch {}
  }
  return { domain, tomlFound: false, addressListed: false };
}

// ---- Normalization helpers ----

// Convert your reason label + impact into the normalized Reason.
// In normalized schema: positive weight = safer, negative = riskier.
// Your "impact" is + when risky. So weight = -impact to align.
function toNormReason(label: string, impact: number): NormReason {
  const code = label
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 32) || "REASON";
  return { code, label, weight: -impact };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();

  if (!address) {
    return NextResponse.json({ status: "error", message: "No address provided" }, { status: 400 });
  }

  let client: Client | null = null;

  try {
    client = new Client("wss://s1.ripple.com");
    await client.connect();

    // account_info with friendlier errors
    let info: any;
    try {
      info = await getAccountInfo(client, address);
    } catch (e: any) {
      const msg = e?.data?.error || e?.message || "";
      if (/accountMalformed|actMalformed/i.test(msg)) {
        return NextResponse.json({ status: "error", message: "Invalid XRP address" }, { status: 400 });
      }
      if (/actNotFound|account not found/i.test(msg)) {
        const legacy = {
          status: "ok" as const,
          verdict: "red" as Verdict,
          points: 4,
          reasons: [{ label: "Account not found (not activated/funded)", impact: +4 }],
          details: { address, notFound: true },
          disclaimer: "Results are indicative only. XRglass cannot guarantee 100% safety.",
        };

        // Normalized block
        const normalized: ScoreResult<{ address: string }> = {
          verdict: "red",
          score: 4, // you’re using "points" = risk
          reasons: legacy.reasons.map(r => toNormReason(r.label, r.impact)),
          subject: { address },
          badges: ["Account not found"],
          ts: new Date().toISOString(),
        };

        return NextResponse.json({ ...legacy, normalized }, { status: 200 });
      }
      throw e;
    }

    const data = info.result.account_data;
    const flags = data.Flags as number | undefined;
    const ownerCount = Number(data.OwnerCount ?? 0);
    const regKey = data.RegularKey as string | undefined;
    const domainHex = data.Domain as string | undefined;

    const { domain, tomlFound, addressListed } = await checkXrpToml(address, domainHex);
    const accountAgeDays = await getAccountAgeDays(client, address);

    // --- Scoring (your current approach) ---
    let points = 0;
    const reasons: { label: string; impact: number }[] = [];
    const badges: string[] = [];

    if (TRUSTED_WALLETS.has(address)) {
      // Legacy payload
      const legacy = {
        status: "ok" as const,
        verdict: "green" as Verdict,
        points: 0,
        reasons: [{ label: "Trusted allowlist wallet", impact: -999 }],
        details: {
          address,
          ownerCount,
          accountAgeDays,
          domain,
          tomlFound,
          addressListed,
          flagsDecoded: {
            RequireDestTag: hasFlag(flags, FLAGS.lsfRequireDestTag),
            RequireAuth: hasFlag(flags, FLAGS.lsfRequireAuth),
            DisallowXRP: hasFlag(flags, FLAGS.lsfDisallowXRP),
            DisableMaster: hasFlag(flags, FLAGS.lsfDisableMaster),
            NoFreeze: hasFlag(flags, FLAGS.lsfNoFreeze),
            GlobalFreeze: hasFlag(flags, FLAGS.lsfGlobalFreeze),
            DefaultRipple: hasFlag(flags, FLAGS.lsfDefaultRipple),
            DepositAuth: hasFlag(flags, FLAGS.lsfDepositAuth),
          },
          regularKeySet: Boolean(regKey),
        },
        disclaimer: "Results are indicative only. XRglass cannot guarantee 100% safety.",
      };

      // Normalized
      const normalized: ScoreResult<{ address: string }> = {
        verdict: "green",
        score: 0,
        reasons: legacy.reasons.map(r => toNormReason(r.label, r.impact)),
        subject: { address },
        badges: ["Trusted wallet", "Allowlist match"],
        ts: new Date().toISOString(),
      };

      return NextResponse.json({ ...legacy, normalized }, { status: 200 });
    }

    // Risky flags
    if (hasFlag(flags, FLAGS.lsfGlobalFreeze)) {
      points += 3;
      reasons.push({ label: "Account has GlobalFreeze set", impact: +3 });
      badges.push("GlobalFreeze");
    }
    if (hasFlag(flags, FLAGS.lsfDisableMaster) && !regKey) {
      points += 2;
      reasons.push({ label: "Master key disabled without RegularKey", impact: +2 });
      badges.push("Master disabled (no RegularKey)");
    }

    // Age
    if (accountAgeDays !== null) {
      if (accountAgeDays < 7) {
        points += 2;
        reasons.push({ label: "Account age < 7 days", impact: +2 });
      } else if (accountAgeDays < 30) {
        points += 1;
        reasons.push({ label: "Account age < 30 days", impact: +1 });
      }
    }

    // OwnerCount
    if (ownerCount > 20) {
      points += 1;
      reasons.push({ label: "High OwnerCount (>20)", impact: +1 });
    }

    // Domain & TOML
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

    // Safer flags
    if (hasFlag(flags, FLAGS.lsfRequireDestTag)) {
      points -= 1;
      reasons.push({ label: "RequireDestTag enabled", impact: -1 });
      badges.push("RequireDestTag");
    }

    const verdict = colorVerdict(points);

    // Legacy payload (unchanged fields so your current UI still works)
    const legacy = {
      status: "ok" as const,
      verdict,
      points,
      reasons,
      details: {
        address,
        ownerCount,
        accountAgeDays,
        domain,
        tomlFound,
        addressListed,
        flagsDecoded: {
          RequireDestTag: hasFlag(flags, FLAGS.lsfRequireDestTag),
          RequireAuth: hasFlag(flags, FLAGS.lsfRequireAuth),
          DisallowXRP: hasFlag(flags, FLAGS.lsfDisallowXRP),
          DisableMaster: hasFlag(flags, FLAGS.lsfDisableMaster),
          NoFreeze: hasFlag(flags, FLAGS.lsfNoFreeze),
          GlobalFreeze: hasFlag(flags, FLAGS.lsfGlobalFreeze),
          DefaultRipple: hasFlag(flags, FLAGS.lsfDefaultRipple),
          DepositAuth: hasFlag(flags, FLAGS.lsfDepositAuth),
        },
        regularKeySet: Boolean(regKey),
      },
      disclaimer: "Results are indicative only. XRglass cannot guarantee 100% safety.",
    };

    // Normalized block (new schema)
    const normalized: ScoreResult<{ address: string }> = {
      verdict,
      score: points, // your "points" is the risk score
      reasons: reasons.map(r => toNormReason(r.label, r.impact)),
      subject: { address },
      badges,
      ts: new Date().toISOString(),
    };

    return NextResponse.json({ ...legacy, normalized }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  } finally {
    try {
      await client?.disconnect();
    } catch {}
  }
}
