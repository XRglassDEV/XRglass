// lib/scoring.ts
type Severity = "low" | "medium" | "high";
type Verdict = "green" | "orange" | "red";

interface Signal {
  id: string;
  label: string;
  severity: Severity;
  evidence?: string;
}

function toVerdict(scoreValue: number): Verdict {
  if (scoreValue >= 70) return "red";
  if (scoreValue >= 35) return "orange";
  return "green";
}

function dropsToXRP(drops: string | number): number {
  const n = typeof drops === "string" ? Number(drops) : drops;
  if (!isFinite(n)) return 0;
  return n / 1_000_000;
}

export function computeScore(data: any) {
  const signals: Signal[] = [];
  let scoreValue = 0;

  const hasAccount = !!data?.accountInfo?.account_data;
  if (!hasAccount) {
    scoreValue += 60;
    signals.push({
      id: "account_not_found",
      label: "Account not found / not funded",
      severity: "high",
    });
  } else {
    const ad = data.accountInfo.account_data;

    const txs: any[] = Array.isArray(data.transactions) ? data.transactions : [];
    if (txs.length < 3) {
      scoreValue += 10;
      signals.push({
        id: "low_activity_history",
        label: "Very limited activity history",
        severity: "low",
      });
    }

    const outgoingPayments = txs
      .map((t) => t.tx)
      .filter((tx: any) => tx?.TransactionType === "Payment" && tx?.Account === ad.Account);

    const largeOut = outgoingPayments.find((tx: any) => {
      if (typeof tx.Amount === "string") {
        return dropsToXRP(tx.Amount) >= 1000;
      }
      return false;
    });

    if (largeOut) {
      scoreValue += 20;
      signals.push({
        id: "recent_large_outflow",
        label: "Recent large outgoing XRP payment",
        severity: "medium",
        evidence: `tx hash ${largeOut?.hash ?? "(unknown)"} ≥ 1000 XRP`,
      });
    }

    const xrpBalance = dropsToXRP(ad.Balance ?? "0");
    if (xrpBalance < 5) {
      scoreValue += 10;
      signals.push({
        id: "very_low_balance",
        label: "Very low XRP balance (< 5 XRP)",
        severity: "low",
      });
    }

    if (ad.Flags === 0) {
      scoreValue += 5;
      signals.push({
        id: "no_protective_account_flags",
        label: "No protective account flags set",
        severity: "low",
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
    cachedAt: data.fetchedAt,
  };
}
