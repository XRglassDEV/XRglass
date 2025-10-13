export const runtime = "nodejs";

export async function GET() {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), { headers: { "content-type": "application/json" }});
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const override = typeof body?.webhook === "string" ? body.webhook.trim() : undefined;
    const itemHook = typeof body?.item?.webhook === "string" ? body.item.webhook.trim() : undefined;
    const candidate = override || itemHook;
    const isValidHook = (url?: string) => !!url && /^https?:\/\//i.test(url);
    const url = isValidHook(candidate) ? candidate : process.env.WEBHOOK_URL;
    if (!url) {
      return new Response(JSON.stringify({ ok: false, error: "WEBHOOK_URL not set" }), { status: 400, headers: { "content-type": "application/json" }});
    }
    const f = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const text = await f.text();
    return new Response(JSON.stringify({ ok: f.ok, status: f.status, body: text.slice(0, 2048) }), { headers: { "content-type": "application/json" }});
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "unknown" }), { status: 500, headers: { "content-type": "application/json" }});
  }
}

export async function DELETE() {
  return new Response(JSON.stringify({ ok: true, deleted: true }), { headers: { "content-type": "application/json" }});
}
