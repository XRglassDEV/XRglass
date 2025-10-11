export type Verdict = 'green' | 'orange' | 'red' | 'unknown';

export type ApiDetails = {
  score?: number | null;
  reasons?: string[];
  [k: string]: unknown;
};

export type ApiSuccess = {
  ok: true;
  verdict: Verdict;
  details?: ApiDetails;
};

export type ApiErr = {
  ok: false;
  message: string;
  code?: string;
};

export type ApiResponse = ApiSuccess | ApiErr;

export function isApiSuccess(x: ApiResponse): x is ApiSuccess {
  return (x as ApiSuccess).ok === true && 'verdict' in x;
}
