// app/api/log-scan/route.ts
import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";
import type { ApiResponse, ApiOk, ApiErr, Verdict } from "@/types/api";

type LogPayload = {
  query: string;
  type: string;
  verdict: Verdict;
  score: number | null;
  details: Record<string, unknown>;
};

const VERDICTS: Verdict[] = ["green", "orange", "red", "unknown"];

function normalizeVerdict(value: unknown): Verdict {
  if (typeof value !== "string") return "unknown";
  const cleaned = value.trim().toLowerCase();
  return (VERDICTS.includes(cleaned as Verdict) ? cleaned : "unknown") as Verdict;
}

function ok(extra: Omit<ApiOk, "status" | "verdict"> = {}): ApiOk {
  return { status: "ok", verdict: "unknown", ...extra };
}

function err(message: string, code?: string): ApiErr {
  return { status: "error", message, code };
}

function parsePayload(value: unknown): LogPayload | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const query = typeof record.query === "string" ? record.query.trim() : "";
  const type = typeof record.type === "string" ? record.type.trim() : "";
  const verdict = normalizeVerdict(record.verdict);

  if (!query || !type) {
    return null;
  }

  const score =
    typeof record.score === "number" && Number.isFinite(record.score)
      ? record.score
      : null;

  const details =
    typeof record.details === "object" && record.details !== null
      ? (record.details as Record<string, unknown>)
      : {};

  return { query, type, verdict, score, details };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = parsePayload(body);
    if (!payload) {
      return NextResponse.json<ApiResponse>(err("Missing required fields"), {
        status: 400,
      });
    }

    const { error } = await supabase
      .from("scan_history")
      .insert([payload]);

    if (error) {
      return NextResponse.json<ApiResponse>(err("Failed to log scan"), {
        status: 502,
      });
    }

    return NextResponse.json<ApiResponse>(
      ok({ details: { recorded: true } }),
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(err("Invalid request body"), {
      status: 400,
    });
  }
}
