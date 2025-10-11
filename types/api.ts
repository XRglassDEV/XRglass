export type Verdict = "green" | "orange" | "red" | "unknown";

export type ReasonLike = string | { label: string; impact?: number };

export type ApiDetails = Record<string, unknown> & {
  score?: number | null;
  reasons?: string[];
};

export type ApiOk = {
  status: "ok";
  verdict: Verdict;
  points?: number;
  reasons?: ReasonLike[];
  details?: ApiDetails;
  disclaimer?: string;
  normalized?: unknown;
  signals?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type ApiErr = {
  status: "error";
  message: string;
  code?: string;
};

export type ApiResponse = ApiOk | ApiErr;
