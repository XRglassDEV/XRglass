const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://xrpl.ws",
  "https://s1.ripple.com:51234",
  "https://rippled.xrpscan.com",
  "https://xrplnode.nixer.one"
];

type Ok = { ok: true; endpoint: string; data: any };
type Fail = { ok: false; message: string };

async function postJson(url: string, body: any, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchAccountInfo(address: string, customEndpoints?: string[]): Promise<Ok | Fail> {
  const endpoints = (customEndpoints?.length ? customEndpoints : DEFAULT_ENDPOINTS).slice(0, 8);
  const payload = { method: "account_info", params: [{ account: address, strict: true, ledger_index: "validated" }] };

  for (const url of endpoints) {
    try {
      const json = await postJson(url, payload, 8000);
      const result = (json && (json.result ?? json)) as any;
      if (result?.account_data) {
        return { ok: true, endpoint: url, data: result };
      }
    } catch {
      // try next
    }
  }
  return { ok: false, message: "All XRPL endpoints failed to respond in time." };
}
