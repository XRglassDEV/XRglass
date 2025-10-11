// lib/scoring-wallet.ts
type Severity = "low" | "medium" | "high";
type Verdict = "green" | "orange" | "red";
interface Signal { id: string; label: string; severity: Severity; evidence?: string; }

const dropsToXRP = (v: string|number)=> (Number(v)||0)/1_000_000;
const toVerdict = (n:number): Verdict => n>=70 ? "red" : n>=35 ? "orange" : "green";

export function computeWalletScore(data: any) {
  const signals: Signal[] = [];
  let scoreValue = 0;

  const hasAccount = !!data?.accountInfo?.account_data || !!data?.accountInfo?.account; // allow rippled/cluster variants
  if (!hasAccount) {
    scoreValue += 60;
    signals.push({ id:"account_not_found", label:"Account not found / not funded", severity:"high" });
  } else {
    const ad = (data.accountInfo.account_data || data.accountInfo);
    const txs: any[] = Array.isArray(data.transactions) ? data.transactions : [];

    if (txs.length < 3) {
      scoreValue += 10;
      signals.push({ id:"low_activity_history", label:"Very limited activity history", severity:"low" });
    }

    const outgoing = txs
      .map((t:any)=> t.tx || t?.transaction || t) // handle shapes
      .filter((tx:any)=> tx?.TransactionType==="Payment" && tx?.Account===ad.Account);

    const big = outgoing.find((tx:any)=> typeof tx?.Amount==="string" && dropsToXRP(tx.Amount) >= 1000);
    if (big) {
      scoreValue += 20;
      signals.push({ id:"recent_large_outflow", label:"Recent large outgoing XRP payment", severity:"medium", evidence:`hash ${big?.hash??""} ≥1000 XRP` });
    }

    const bal = dropsToXRP(ad.Balance ?? "0");
    if (bal < 5) {
      scoreValue += 10;
      signals.push({ id:"very_low_balance", label:"Very low XRP balance (< 5 XRP)", severity:"low" });
    }

    if ((ad.Flags ?? 0) === 0) {
      scoreValue += 5;
      signals.push({ id:"no_protective_account_flags", label:"No protective account flags set", severity:"low" });
    }
  }

  const score = toVerdict(scoreValue);
  const summary =
    score==="red" ? "High risk — missing account data or strong risky signals."
    : score==="orange" ? "Moderate risk — some warning signals detected."
    : "Low risk — no major red flags in basic checks.";

  return { address: data.address, score, scoreValue, signals, summary, cachedAt: data.fetchedAt };
}
