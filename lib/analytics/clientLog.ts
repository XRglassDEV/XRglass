export type ScanLog = {
  ts: number;
  target: string;
  verdict?: "green" | "orange" | "red";
  ok: boolean;
  node?: string;
  latency?: number;
};

const KEY = "xrglass.scanlog.v1";
const MAX = 50;

export function logScan(entry: ScanLog) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    const arr: ScanLog[] = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    if (arr.length > MAX) arr.length = MAX;
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
}

export function readScans(): ScanLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
