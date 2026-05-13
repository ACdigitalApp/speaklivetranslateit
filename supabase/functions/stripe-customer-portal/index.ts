// Edge function: stripe-customer-portal
// Crea un link al Customer Portal di Stripe per gestire l'abbonamento.
import Stripe from "https://esm.sh/stripe@17.4.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL") || "https://speaklivetranslate.it";
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe non configurato" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: customerRow } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .ilike("email", email)
      .maybeSingle();

    if (!customerRow?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "Nessun customer Stripe associato a questa email." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerRow.stripe_customer_id,
      return_url: `${siteUrl}/pricing`,
    });

    return new Response(JSON.stringify({ portal_url: portal.url }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-customer-portal] error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
