// lib/ws-fallback.ts
// Idempotent shim: make "ws" skip native addons. Safe to import multiple times.
import Module from "module";

declare global {
  // mark so we don't patch twice
  // (no "?" after the var name — TS doesn't allow optional here)
  // eslint-disable-next-line no-var
  var __WS_FALLBACK_PATCHED__: boolean | undefined;
}

if (!globalThis.__WS_FALLBACK_PATCHED__) {
  const origLoad = (Module as any)._load as typeof Module._load;
  (Module as any)._load = function (req: string, parent: any, isMain: boolean) {
    if (req === "bufferutil" || req === "utf-8-validate") {
      // Force ws to use pure-JS fallback
      throw new Error("skip native ws addon");
    }
    return origLoad.apply(this, arguments as any);
  };
  globalThis.__WS_FALLBACK_PATCHED__ = true;
}
