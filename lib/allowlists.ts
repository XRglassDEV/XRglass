export const TRUSTED_WALLETS: Record<string, string> = {
  "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh": "Ripple (donation/legacy)",
  "rHLEki8gPUMnF72JYdUuD3aKcsfScYz6t": "XRPL Labs (Xumm)",
  "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq": "GateHub"
};

function envTrustedMap(): Record<string, string> {
  const s = process.env.XRGLASS_TRUSTED_WALLETS || "";
  const map: Record<string, string> = {};
  for (const raw of s.split(",").map(x => x.trim()).filter(Boolean)) {
    // allow optional label with '|', e.g. r...|My Label
    const [addr, label] = raw.split("|");
    if (/^r[1-9A-HJ-NP-Za-km-z]{24,35}$/.test(addr)) map[addr] = label?.trim() || "Env trusted";
  }
  return map;
}

export function getTrustedWallets(): Record<string, string> {
  return { ...TRUSTED_WALLETS, ...envTrustedMap() };
}
export function isTrustedWallet(address: string): boolean {
  return !!getTrustedWallets()[address];
}
export function trustedLabel(address: string): string {
  return getTrustedWallets()[address] || "Trusted";
}
