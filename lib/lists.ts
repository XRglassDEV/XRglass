// lib/lists.ts
// Central place for curated lists used by both wallet & project scanners.

export const TRUSTED_WALLETS = new Set<string>([
  "rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh", // Ripple donation
  // add more...
]);

export const BLOCKED_WALLETS = new Set<string>([
  // known scam wallets here
]);

export const TRUSTED_DOMAINS = new Set<string>([
  // e.g., "xrpl.org", "ripple.com"
]);

export const BLOCKED_DOMAINS = new Set<string>([
  // e.g., "xrp-giveaway.live"
]);

// Utility
export const isTrustedWallet = (a: string) => TRUSTED_WALLETS.has(a);
export const isBlockedWallet = (a: string) => BLOCKED_WALLETS.has(a);
export const isTrustedDomain = (d: string) => TRUSTED_DOMAINS.has(d);
export const isBlockedDomain = (d: string) => BLOCKED_DOMAINS.has(d);
