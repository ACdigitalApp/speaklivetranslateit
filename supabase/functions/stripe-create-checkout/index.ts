// Edge function: stripe-create-checkout
// Crea una Stripe Checkout Session in mode=subscription per Speak & Translate Live Premium.
// Riceve dal frontend SOLO `plan` ("monthly" | "yearly"). I price ID vivono server-side.
import Stripe from "https://esm.sh/stripe@17.4.0?target=denonext";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const priceMonthly = Deno.env.get("STRIPE_PRICE_ID_MONTHLY");
    const priceYearly = Deno.env.get("STRIPE_PRICE_ID_YEARLY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://speaklivetranslate.it";

    if (!stripeKey || !priceMonthly || !priceYearly) {
      return new Response(
        JSON.stringify({ error: "Stripe non configurato (secrets mancanti)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = String(body?.plan || "").toLowerCase();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : undefined;

    if (plan !== "monthly" && plan !== "yearly") {
      return new Response(
        JSON.stringify({ error: "plan must be 'monthly' or 'yearly'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const priceId = plan === "monthly" ? priceMonthly : priceYearly;

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          app_key: "speak_translate_live",
          plan,
          source: "speaklivetranslate.it",
        },
      },
      allow_promotion_codes: true,
      customer_email: email,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cancel`,
      metadata: {
        app_key: "speak_translate_live",
        plan,
        source: "speaklivetranslate.it",
      },
    });

    return new Response(
      JSON.stringify({ checkout_url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[stripe-create-checkout] error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
