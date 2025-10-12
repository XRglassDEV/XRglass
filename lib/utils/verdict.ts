export type Verdict = "green" | "orange" | "red";
export function normalizeVerdict(v: unknown): Verdict | undefined {
  return v === "green" || v === "orange" || v === "red" ? v : undefined;
}
