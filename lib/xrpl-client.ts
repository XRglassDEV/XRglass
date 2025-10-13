import axios from "axios";

const DEFAULT_ENDPOINTS = [
  "https://xrplcluster.com",
  "https://xrpl.ws",
  "https://s1.ripple.com:51234",
  "https://xrplnode.nixer.one",
  "https://xrpl.link",
];

export async function fetchAccountInfo(address: string, customEndpoints?: string[]) {
  const endpoints = customEndpoints?.length ? customEndpoints : DEFAULT_ENDPOINTS;
  const payload = { method: "account_info", params: [{ account: address, strict: true }] };

  for (const url of endpoints) {
    try {
      const res = await axios.post(url, payload, { timeout: 6000 });
      if (res.data && res.data.result?.account_data) {
        return { ok: true, endpoint: url, data: res.data.result };
      }
    } catch (e) {
      continue; // probeer volgende
    }
  }
  return { ok: false, message: "All XRPL endpoints failed to respond in time." };
}
