// lib/scoring-wallet.ts

export type Severity = "low" | "medium" | "high";
export type Verdict = "green" | "orange" | "red";

export interface Signal {
  id: string;
  label: string;
  severity: Severity;
  evidence?: string;
}

export interface WalletAccountData extends Record<string, unknown> {
  Account?: string;
  Balance?: string | number;
  Flags?: number;
}

export interface WalletAccountInfo extends Record<string, unknown> {
  account_data?: WalletAccountData;
  account?: WalletAccountData;
}

export type WalletTransaction = Record<string, unknown>;

export interface WalletScanInput {
  address: string;
  accountInfo: WalletAccountInfo | null;
  transactions: WalletTransaction[];
  fetchedAt: string;
}

const dropsToXRP = (value: string | number) => (Number(value) || 0) / 1_000_000;
const toVerdict = (score: number): Verdict =>
  score >= 70 ? "red" : score >= 35 ? "orange" : "green";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getAccountData(info: WalletAccountInfo | null): WalletAccountData | null {
  if (!info) {
    return null;
  }

  if (isRecord(info.account_data)) {
    return info.account_data as WalletAccountData;
  }

  if (isRecord(info.account)) {
    return info.account as WalletAccountData;
  }

  return null;
}

function normaliseTransactions(transactions: WalletTransaction[]): WalletTransaction[] {
  return transactions
    .map((tx) => {
      if (isRecord(tx.tx)) {
        return tx.tx as WalletTransaction;
      }
      if (isRecord(tx.transaction)) {
        return tx.transaction as WalletTransaction;
      }
      return tx;
    })
    .filter(isRecord) as WalletTransaction[];
}

export function computeWalletScore(data: WalletScanInput) {
  const signals: Signal[] = [];
  let scoreValue = 0;

  const accountData = getAccountData(data.accountInfo);
  const hasAccount = !!accountData;

  if (!hasAccount) {
    scoreValue += 60;
    signals.push({
      id: "account_not_found",
      label: "Account not found / not funded",
      severity: "high"
    });
  } else {
    const txs = normaliseTransactions(data.transactions);

    if (txs.length < 3) {
      scoreValue += 10;
      signals.push({
        id: "low_activity_history",
        label: "Very limited activity history",
        severity: "low"
      });
    }

    const outgoing = txs.filter(
      (tx) =>
        typeof tx.TransactionType === "string" &&
        tx.TransactionType === "Payment" &&
        typeof tx.Account === "string" &&
        tx.Account === accountData.Account
    );

    const largeOutgoing = outgoing.find((tx) => {
      if (typeof tx.Amount === "string") {
        return dropsToXRP(tx.Amount) >= 1000;
      }
      return false;
    });

    if (largeOutgoing) {
      scoreValue += 20;
      signals.push({
        id: "recent_large_outflow",
        label: "Recent large outgoing XRP payment",
        severity: "medium",
        evidence: `hash ${typeof largeOutgoing.hash === "string" ? largeOutgoing.hash : ""} ≥1000 XRP`
      });
    }

    const balance = dropsToXRP(accountData.Balance ?? "0");
    if (balance < 5) {
      scoreValue += 10;
      signals.push({
        id: "very_low_balance",
        label: "Very low XRP balance (< 5 XRP)",
        severity: "low"
      });
    }

    if ((accountData.Flags ?? 0) === 0) {
      scoreValue += 5;
      signals.push({
        id: "no_protective_account_flags",
        label: "No protective account flags set",
        severity: "low"
      });
    }
  }

  const verdict = toVerdict(scoreValue);
  const summary =
    verdict === "red"
      ? "High risk — missing account data or strong risky signals."
      : verdict === "orange"
        ? "Moderate risk — some warning signals detected."
        : "Low risk — no major red flags in basic checks.";

  return {
    address: data.address,
    score: verdict,
    scoreValue,
    signals,
    summary,
    cachedAt: data.fetchedAt
  };
}
