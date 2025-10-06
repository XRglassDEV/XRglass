// app/api/project/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

type ProjectResult = {
  status: "ok" | "error";
  domain?: string;
  toml?: string | null;
  tomlParsed?: Record<string, any> | null;
  tomlFound?: boolean;
  github?: { repo?: string; stars?: number | null; lastCommit?: string | null } | null;
  message?: string;
  disclaimer?: string;
};

async function fetchWithTimeout(url: string, ms = 3500) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "XRglass/1.0 (+https://xrpulse.app)" },
      signal: ctrl.signal,
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

function parseSimpleToml(tomlText: string) {
  // quick heuristic parse: find lines like "NAME = \"value\"" and [fields]
  const out: Record<string, any> = {};
  const lines = tomlText.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*["'](.+?)["']\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const domain = url.searchParams.get("domain");
  if (!domain) {
    return NextResponse.json({ status: "error", message: "No domain provided" }, { status: 400 });
  }

  const base = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const tomlUrls = [
    `https://${base}/.well-known/xrp.toml`,
    `https://www.${base}/.well-known/xrp.toml`,
  ];

  let tomlText: string | null = null;
  let tomlFound = false;
  let parsed: Record<string, any> | null = null;

  for (const u of tomlUrls) {
    try {
      const r = await fetchWithTimeout(u, 3000);
      if (!r.ok) continue;
      tomlText = await r.text();
      tomlFound = true;
      parsed = parseSimpleToml(tomlText);
      break;
    } catch (e) {
      // ignore and try next
    }
  }

  // If there is a repo URL in TOML, try to fetch GitHub metadata (very naive)
  let githubMeta: ProjectResult["github"] = null;
  const repoUrl = parsed?.Repository || parsed?.repo || parsed?.repository || null;
  if (repoUrl && repoUrl.includes("github.com")) {
    try {
      // normalize URL -> owner/repo
      const m = repoUrl.match(/github\.com\/([^\/]+\/[^\/]+)(?:\/|$)/i);
      if (m) {
        const ownerRepo = m[1].replace(/\.git$/, "");
        const apiUrl = `https://api.github.com/repos/${ownerRepo}`;
        const r2 = await fetchWithTimeout(apiUrl, 3500);
        if (r2?.ok) {
          const j = await r2.json();
          githubMeta = {
            repo: ownerRepo,
            stars: typeof j.stargazers_count === "number" ? j.stargazers_count : null,
            lastCommit: j.pushed_at ?? null,
          };
        }
      }
    } catch {}
  }

  const result: ProjectResult = {
    status: "ok",
    domain: base,
    toml: tomlText,
    tomlParsed: parsed,
    tomlFound,
    github: githubMeta,
    disclaimer:
      "Results are indicative only. XRglass cannot guarantee 100% safety. Always do your own research.",
  };

  return NextResponse.json(result);
}
