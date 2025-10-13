import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripeKey = process.env.STRIPE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!stripeKey) {
  throw new Error("STRIPE_KEY env var is not set");
}

const stripe = new Stripe(stripeKey);

function resolveUrl(path: string | undefined): string {
  const base = appUrl ?? "http://localhost:3000";
  try {
    const url = new URL(path ?? "/dashboard", base);
    return url.toString();
  } catch (error) {
    console.warn("Invalid URL path provided to subscribe endpoint", error);
    return `${base.replace(/\/$/, "")}/dashboard`;
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const priceId = body?.priceId as string | undefined;
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: resolveUrl(body?.successPath),
      cancel_url: resolveUrl(body?.cancelPath),
    });

    if (!session.url) {
      throw new Error("Stripe did not return a session URL");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
