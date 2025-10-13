import { supabase } from "@/lib/supabaseClient";
import xrpl from "xrpl";

export const runtime = "nodejs";

const WHALE_THRESHOLD_XRP = 100_000;

function encode(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id")?.trim();

  if (!userId) {
    return new Response("missing user_id", { status: 400 });
  }

  const { data: subscription, error: subError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("plan", "pro")
    .eq("status", "active")
    .maybeSingle();

  if (subError) {
    return new Response(subError.message, { status: 500 });
  }

  if (!subscription) {
    return new Response("forbidden", { status: 403 });
  }

  const { data: addon, error: addonError } = await supabase
    .from("addons")
    .select("id")
    .eq("user_id", userId)
    .eq("addon_type", "whalescope")
    .eq("status", "active")
    .maybeSingle();

  if (addonError) {
    return new Response(addonError.message, { status: 500 });
  }

  if (!addon) {
    return new Response("forbidden", { status: 403 });
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const requestSignal = request.signal;

  let cleanupRef: (() => Promise<void>) | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (payload: unknown) => controller.enqueue(encoder.encode(encode(payload)));
      const client = new xrpl.Client(process.env.XRPL_WSS || "wss://xrplcluster.com");
      let active = true;

      const heartbeat = setInterval(() => {
        if (active) enqueue({ type: "heartbeat", ts: Date.now() });
      }, 15_000);

      const cleanup = async () => {
        active = false;
        clearInterval(heartbeat);
        try {
          client.removeAllListeners();
          if (client.isConnected()) {
            await client.disconnect();
          }
        } catch (error) {
          console.warn("whalescope disconnect error", error);
        }
        controller.close();
      };

      cleanupRef = cleanup;

      try {
        await client.connect();
        await client.request({ command: "subscribe", streams: ["transactions"] });

        client.on("transaction", (event: any) => {
          try {
            const rawAmount = event?.transaction?.Amount;
            if (typeof rawAmount !== "string") return;
            const amountDrops = Number(rawAmount);
            if (!Number.isFinite(amountDrops)) return;
            const amountXrp = amountDrops / 1_000_000;
            if (amountXrp < WHALE_THRESHOLD_XRP) return;

            enqueue({
              type: "whale",
              xrp: amountXrp,
              hash: event.transaction?.hash,
              account: event.transaction?.Account,
              destination: event.transaction?.Destination,
              ledger_index: event.ledger_index,
            });
          } catch (error) {
            console.warn("whalescope transaction handler error", error);
          }
        });
      } catch (error) {
        enqueue({ type: "error", message: error instanceof Error ? error.message : String(error) });
        await cleanup();
        return;
      }

      if (requestSignal) {
        requestSignal.addEventListener("abort", () => {
          cleanup().catch(() => undefined);
        });
      }
    },
    cancel() {
      cleanupRef?.().catch(() => undefined);
    },
  });

  return new Response(stream, { headers });
}
