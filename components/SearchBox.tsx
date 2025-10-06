// components/SearchBox.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function looksLikeXrpAddress(input: string) {
  // Basic check: starts with 'r' and between 25-35 base58 chars
  // XRPL addresses are base58 (but this is a pragmatic check)
  return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(input.trim());
}

function looksLikeDomain(input: string) {
  // Accept domain or URL
  return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}\/?.*/i.test(input.trim());
}

export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  const [q, setQ] = useState(defaultValue);
  const [type, setType] = useState<"wallet" | "project">("wallet");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function submit() {
    setError(null);
    const v = q.trim();
    if (!v) {
      setError("Enter a wallet address or project domain.");
      return;
    }

    if (looksLikeXrpAddress(v)) {
      router.push(`/scan?type=wallet&address=${encodeURIComponent(v)}`);
      return;
    }

    if (looksLikeDomain(v)) {
      // if user supplied URL, extract domain
      const domain = v.replace(/^https?:\/\//i, "").split("/")[0];
      router.push(`/scan?type=project&domain=${encodeURIComponent(domain)}`);
      return;
    }

    setError("Not recognized. Paste a valid XRP address (r...) or a project domain (example.com).");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-3 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Paste XRP address (r...) or project domain (example.com)"
          className="flex-1 rounded-md border px-4 py-3 bg-slate-800 text-white placeholder:opacity-60"
        />
        <button onClick={submit} className="px-4 py-2 rounded-md bg-blue-500 text-white">Start Scan</button>
      </div>
      {error && <div className="mt-2 text-sm text-rose-400">{error}</div>}
      <div className="mt-2 text-xs opacity-70">
        Tip: paste a wallet (r...) or a project domain (example.com). We'll automatically detect type.
      </div>
    </div>
  );
}
