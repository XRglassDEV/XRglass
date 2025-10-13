import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SHOULD_REDIRECT_TO_DASHBOARD =
  process.env.VERCEL_ENV === "production" ||
  process.env.VERCEL_ENV === "preview";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice(4);
    return NextResponse.redirect(url, 301);
  }

  if (SHOULD_REDIRECT_TO_DASHBOARD && url.pathname === "/") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}
