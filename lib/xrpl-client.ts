const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://xrpl.ws",
  "https://xrpl.link",
  "https://s1.ripple.com:51234",
  "https://xrpl.org/data/api/v1/",
  "https://rippled.xrpscan.com",
  "https://xrpl.node.robustwallet.io",
  "https://public.xrplnode.org:51234"
];

type JsonObject = Record<string, unknown>;

async function postJson<T extends JsonObject>(url: string, body: JsonObject, timeoutMs = 7000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export type FetchAccountInfoResult = {
  ok: boolean;
  endpoint: string | null;
  data?: JsonObject;
  message?: string;
  errors?: { endpoint: string; error: string }[];
  tried?: string[];
};

function buildErrorMessage(result: JsonObject | undefined): string | undefined {
  const err = result?.error_message || result?.error || result?.status;
  return typeof err === "string" ? err : undefined;
}

function isAccountNotFound(result: JsonObject | undefined): boolean {
  const parts = [
    result?.error,
    result?.error_message,
    result?.message,
  ]
    .map((v: unknown) => (typeof v === "string" ? v.toLowerCase() : ""))
    .join(" ");
  return /actnotfound|account not found/.test(parts);
}

export async function fetchAccountInfo(address: string, customEndpoints?: string[]): Promise<FetchAccountInfoResult> {
  const endpoints = customEndpoints?.length ? customEndpoints : DEFAULT_ENDPOINTS;
  const payload = {
    method: "account_info",
    params: [{ account: address, strict: true, ledger_index: "validated" }],
  };

  const errors: { endpoint: string; error: string }[] = [];
  for (const url of endpoints) {
    try {
      const json = await postJson<JsonObject>(url, payload, 8000);
      const result = (json.result as JsonObject | undefined) ?? json;
      if (result?.account_data) {
        return { ok: true, endpoint: url, data: result, tried: endpoints };
      }

      const message = buildErrorMessage(result);
      errors.push({ endpoint: url, error: message || "Unexpected XRPL response" });

      if (isAccountNotFound(result)) {
        return { ok: false, endpoint: url, data: result, message: message, errors, tried: endpoints };
      }
    } catch (err: unknown) {
      const message = typeof (err as { message?: unknown })?.message === "string"
        ? String((err as { message: unknown }).message)
        : "Request failed";
      errors.push({ endpoint: url, error: message });
      console.warn("XRPL endpoint failed:", url, message);
    }
  }

  return {
    ok: false,
    endpoint: null,
    message: "All XRPL nodes failed to respond. Network busy or node downtime.",
    errors,
    tried: endpoints,
  };
}
