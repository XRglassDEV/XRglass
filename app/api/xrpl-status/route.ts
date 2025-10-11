import { NextResponse } from "next/server";

import { connectXRPL } from "@/lib/xrpl/connect";

export async function GET() {
  try {
    const { client, node, latency } = await connectXRPL();
    try {
      const info = await client.request({ command: "server_info" });
      return NextResponse.json({
        status: "ok",
        node,
        latency,
        info: info.result ?? null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "request_failed";
      return NextResponse.json(
        {
          status: "error",
          message: message || "request_failed",
        },
        { status: 502 },
      );
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "all_nodes_failed";
    return NextResponse.json(
      {
        status: "error",
        message: message || "all_nodes_failed",
      },
      { status: 503 },
    );
  }
}
