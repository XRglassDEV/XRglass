export const runtime = "nodejs";
import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    branch: process.env.NEXT_PUBLIC_GIT_BRANCH ?? null,
    commit: process.env.NEXT_PUBLIC_GIT_COMMIT ?? null,
    ts: Date.now()
  });
}
