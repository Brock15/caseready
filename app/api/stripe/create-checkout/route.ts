import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import Stripe from "stripe";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabaseConfig";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

const isRecurringPrice = (price: Stripe.Price) => Boolean(price.recurring);

export async function POST(req: Request) {
  try {
    const { priceId } = await req.json();
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient(
      {
        cookies: (() => cookieStore) as unknown as () => ReturnType<typeof cookies>,
      },
      {
        supabaseUrl: SUPABASE_URL,
        supabaseKey: SUPABASE_ANON_KEY,
      }
    );

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const email = user.email || undefined;
    const existingCustomerId = user.user_metadata?.stripeCustomerId as string | undefined;

    let customerId = existingCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabaseUserId: user.id },
      });
      customerId = customer.id;
      await supabase.auth.updateUser({
        data: { stripeCustomerId: customerId },
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
      success_url: "https://caseready.io/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://caseready.io/pricing",
      allow_promotion_codes: true,
    };

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
  } catch (error) {
    console.error("Stripe checkout session error", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
