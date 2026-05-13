// Edge function: stripe-webhook
// Riceve eventi Stripe firmati con STRIPE_WEBHOOK_SECRET, idempotenti su event.id.
// Aggiorna stripe_customers / stripe_subscriptions e logga in stripe_webhook_events.
// Notifica admin via funzione `notify-admin` per: new_subscription, new_payment, payment_failed.
import Stripe from "https://esm.sh/stripe@17.4.0?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "stripe-signature, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function notifyAdminServer(eventType: string, idempotencyKey: string, data: Record<string, unknown>) {
  try {
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-admin`;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        appKey: "speak_translate_live",
        appName: "Speak & Translate Live",
        eventType,
        idempotencyKey,
        environment: "production",
        data,
      }),
    });
  } catch (e) {
    console.warn("[stripe-webhook] notify-admin failed (non-blocking):", e);
  }
}

async function upsertCustomer(stripeCustomerId: string, email: string | null) {
  await supabase.from("stripe_customers").upsert(
    { stripe_customer_id: stripeCustomerId, email: email?.toLowerCase() ?? null, updated_at: new Date().toISOString() },
    { onConflict: "stripe_customer_id" },
  );
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  await supabase.from("stripe_subscriptions").upsert(
    {
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      stripe_price_id: item?.price.id ?? null,
      plan: (sub.metadata?.plan as string) ?? null,
      status: sub.status,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Stripe non configurato", { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400, headers: corsHeaders });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return new Response(`Bad signature: ${(err as Error).message}`, { status: 400, headers: corsHeaders });
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id, status")
    .eq("id", event.id)
    .maybeSingle();
  if (existing && existing.status === "processed") {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  await supabase.from("stripe_webhook_events").upsert(
    { id: event.id, event_type: event.type, status: "received" },
    { onConflict: "id" },
  );

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (customerId) await upsertCustomer(customerId, session.customer_email ?? session.customer_details?.email ?? null);
        if (session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);
          const isTrialing = sub.status === "trialing" || !!sub.trial_end;
          const evtType = isTrialing ? "trial_started" : "new_subscription";
          await notifyAdminServer(evtType, `${evtType}-${sub.id}`, {
            email: session.customer_email ?? session.customer_details?.email,
            plan: sub.metadata?.plan ?? session.metadata?.plan,
            subscription_status: sub.status,
            stripe_event_id: event.id,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await notifyAdminServer("new_payment", `inv-${invoice.id}`, {
          email: invoice.customer_email,
          plan: (invoice.lines.data[0]?.price?.recurring?.interval) === "year" ? "yearly" : "monthly",
          amount: (invoice.amount_paid ?? 0) / 100,
          currency: (invoice.currency || "eur").toUpperCase(),
          subscription_status: "active",
          stripe_event_id: event.id,
        });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await notifyAdminServer("payment_failed", `invfail-${invoice.id}`, {
          email: invoice.customer_email,
          amount: (invoice.amount_due ?? 0) / 100,
          currency: (invoice.currency || "eur").toUpperCase(),
          subscription_status: "past_due",
          stripe_event_id: event.id,
        });
        break;
      }
      default:
        // ignore other events
        break;
    }

    await supabase.from("stripe_webhook_events").update({ status: "processed" }).eq("id", event.id);
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[stripe-webhook] handler error:", err);
    await supabase
      .from("stripe_webhook_events")
      .update({ status: "failed", error_message: (err as Error).message })
      .eq("id", event.id);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
