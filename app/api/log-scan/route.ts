// app/api/log-scan/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, type, verdict, score, details } = body;

    if (!query || !type || !verdict) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scan_history")
      .insert([{ query, type, verdict, score, details }]);

    if (error) throw error;

    return NextResponse.json({ status: "ok", data });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
