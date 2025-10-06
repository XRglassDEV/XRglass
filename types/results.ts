// types/results.ts
export type Verdict = "green" | "orange" | "red";

export type ApiOk = {
  status: "ok";
  verdict: Verdict;
  points: number;
  reasons?: Array<string | { label: string; impact?: number }>;
  details?: any;
  disclaimer?: string;
  normalized?: unknown; // optional normalized block
};

export type ApiErr = { status: "error"; message: string };

export type ApiResult = ApiOk | ApiErr;
