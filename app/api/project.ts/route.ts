// app/api/project/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import type { ApiResponse, ApiOk, ApiErr, Verdict } from "@/types/api";

const DISCLAIMER =
  "Results are indicative only. XRglass cannot guarantee 100% safety. Always do your own research.";

const GITHUB_RE = /github\.com\/([^\/]+\/[^\/]+)(?:\/|$)/i;

type GithubInfo = {
  repo: string;
  stars: number | null;
  lastCommit: string | null;
};

type ProjectDetails = {
  domain: string;
  tomlFound: boolean;
  tomlUrl: string | null;
  tomlParsed: Record<string, string> | null;
  github: GithubInfo | null;
};

function ok(verdict: Verdict, extra: Omit<ApiOk, "status" | "verdict"> = {}): ApiOk {
  return { status: "ok", verdict, ...extra };
}

function err(message: string, code?: string): ApiErr {
  return { status: "error", message, code };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 10_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...init,
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function parseSimpleToml(tomlText: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = tomlText.split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*["'](.+?)["']\s*$/);
    if (match) {
      const key = match[1];
      const value = match[2];
      out[key] = value;
    }
  }
  return out;
}

function getRepoFromToml(parsed: Record<string, string> | null): string | null {
  if (!parsed) return null;
  const candidates = [parsed.Repository, parsed.repo, parsed.repository];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.includes("github.com")) {
      return candidate;
    }
  }
  return null;
}

function extractGithubRepo(url: string): string | null {
  const match = url.match(GITHUB_RE);
  if (!match) return null;
  return match[1].replace(/\.git$/i, "");
}

function parseGithubJson(value: unknown): GithubInfo | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const stars = record.stargazers_count;
  const pushedAt = record.pushed_at;
  return {
    repo: typeof record.full_name === "string" ? record.full_name : "",
    stars: typeof stars === "number" && Number.isFinite(stars) ? stars : null,
    lastCommit: typeof pushedAt === "string" ? pushedAt : null,
  };
}

function getDomainParam(url: URL): string | null {
  const param = url.searchParams.get("domain");
  if (!param) return null;
  const trimmed = param.trim();
  return trimmed ? trimmed : null;
}

export async function GET(req: Request) {
  try {
    const domainParam = getDomainParam(new URL(req.url));
    if (!domainParam) {
      return NextResponse.json<ApiResponse>(err("No domain provided"), {
        status: 400,
      });
    }

    const base = domainParam.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!base) {
      return NextResponse.json<ApiResponse>(err("Domain is invalid"), {
        status: 400,
      });
    }
    const tomlUrls = [
      `https://${base}/.well-known/xrp.toml`,
      `https://www.${base}/.well-known/xrp.toml`,
    ];

    let tomlText: string | null = null;
    let tomlUrl: string | null = null;
    let tomlParsed: Record<string, string> | null = null;

    for (const candidate of tomlUrls) {
      try {
        const response = await fetchWithTimeout(candidate, {
          headers: { "User-Agent": "XRglass/1.0 (+https://xrpulse.app)" },
        }, 10_000);
        if (!response.ok) continue;
        const text = await response.text();
        tomlText = text;
        tomlUrl = candidate;
        tomlParsed = parseSimpleToml(text);
        break;
      } catch {
        // ignore fetch errors and try the next candidate
      }
    }

    const tomlFound = Boolean(tomlText);

    let github: GithubInfo | null = null;
    const repoUrl = getRepoFromToml(tomlParsed);
    const repo = repoUrl ? extractGithubRepo(repoUrl) : null;

    if (repo) {
      try {
        const ghResponse = await fetchWithTimeout(`https://api.github.com/repos/${repo}`, {
          headers: {
            "User-Agent": "XRglass/1.0 (+https://xrpulse.app)",
            Accept: "application/vnd.github+json",
          },
        });

        if (ghResponse.ok) {
          const ghJson = await ghResponse.json();
          const info = parseGithubJson(ghJson);
          if (info) {
            github = {
              repo: info.repo || repo,
              stars: info.stars,
              lastCommit: info.lastCommit,
            };
          }
        }
      } catch {
        // ignore GitHub errors silently
      }
    }

    const details: ProjectDetails = {
      domain: base,
      tomlFound,
      tomlUrl,
      tomlParsed,
      github,
    };

    return NextResponse.json<ApiResponse>(
      ok("unknown", {
        details,
        domain: base,
        toml: tomlText,
        tomlFound,
        tomlParsed,
        tomlUrl,
        github,
        disclaimer: DISCLAIMER,
      }),
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(err("Internal server error"), {
      status: 500,
    });
  }
}
