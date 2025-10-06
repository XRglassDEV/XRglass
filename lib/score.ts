// lib/score.ts
export type Verdict = "green" | "orange" | "red";

export type Reason = {
  code: string;             // short machine ID, e.g. "ALLOWLIST_HIT"
  label: string;            // human label, e.g. "Allowlist match"
  weight: number;           // positive lowers risk, negative increases risk
  detail?: string;          // extra info displayed in UI
};

export type ScoreResult<T = unknown> = {
  verdict: Verdict;
  score: number;            // 0 = safest, higher = riskier
  reasons: Reason[];
  subject: T;               // the scanned target (wallet, domain, etc.)
  badges: string[];         // strings the UI turns into badges
  ts: string;               // ISO timestamp
};

export function verdictFromScore(score: number): Verdict {
  if (score <= 1) return "green";
  if (score <= 3) return "orange";
  return "red";
}

export function combine(reasons: Reason[]): { score: number; verdict: Verdict } {
  // Start from baseline 2 (neutral). Positive weights reduce risk.
  const baseline = 2;
  const summed = reasons.reduce((acc, r) => acc - r.weight, baseline);
  const score = Math.max(0, Number(summed.toFixed(2)));
  return { score, verdict: verdictFromScore(score) };
}

export function addReason(
  list: Reason[],
  reason: Reason | false | undefined
): void {
  if (reason) list.push(reason);
}
