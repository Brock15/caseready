export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";

const isRecurringPrice = (price: Stripe.Price) => Boolean(price.recurring);

const getStripe = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
};

const getUserFromToken = async (token: string) => {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
};

const decodeJwt = (token?: string | null) => {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    );
    return decoded as { sub?: string; email?: string };
  } catch {
    return null;
  }
};

const getTokenFromCookies = (req: Request) => {
  const cookieHeader = req.headers.get("cookie") || "";
  const authCookie = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("sb-") && c.includes("auth-token"));
  if (!authCookie) return null;
  try {
    const tokenValue = decodeURIComponent(authCookie.split("=")[1] || "");
    const parsed = JSON.parse(tokenValue);
    return (
      parsed?.access_token || parsed?.currentSession?.access_token || null
    );
  } catch {
    return null;
  }
};

const siteUrlRaw =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
if (!siteUrlRaw) {
  throw new Error("Missing NEXT_PUBLIC_SITE_URL / VERCEL_URL");
}
const siteUrl = siteUrlRaw.replace(/\/$/, "");

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const { priceId, accessToken: bodyAccessToken } = await req.json();
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : null;
    const cookieToken = getTokenFromCookies(req);
    const token =
      (bodyAccessToken as string | undefined) || bearerToken || cookieToken;

    let user = token ? await getUserFromToken(token) : null;
    if (!user && token) {
      const decoded = decodeJwt(token);
      if (decoded?.sub) {
        user = { id: decoded.sub, email: decoded.email } as any;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.email || undefined;
    const existingCustomerId = (user as any).user_metadata?.stripeCustomerId as string | undefined;

    let customerId = existingCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabaseUserId: user.id },
      });
      customerId = customer.id;
      // Best-effort: do not block checkout on metadata failure
      await getUserFromToken(token || "").then(async (u) => {
        if (!u) return;
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        await client.auth.updateUser({ data: { stripeCustomerId: customerId } }).catch(() => {});
      });
    }

    const price = await stripe.prices.retrieve(priceId);
    const mode: Stripe.Checkout.SessionCreateParams.Mode = isRecurringPrice(price)
      ? "subscription"
      : "payment";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: ["card"],
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      allow_promotion_codes: true,
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json(
      { url: checkoutSession.url, sessionId: checkoutSession.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Stripe checkout session error", error);
    const message =
      error instanceof Error ? error.message : "Failed to create checkout session";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
