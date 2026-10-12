// Edge function: sumup-checkout
// action "create": crea un checkout SumUp ospitato per il piano scelto.
// action "verify": verifica lato server lo stato del checkout su SumUp e, solo se PAID
// con importo/valuta/riferimento corretti, attiva Premium (idempotente sul riferimento).
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@3";

const PLANS = {
  monthly: { amount: 7.99, planType: "premium_monthly", months: 1, label: "Premium Monthly" },
  yearly: { amount: 49.99, planType: "premium_yearly", months: 12, label: "Premium Yearly" },
} as const;
const CURRENCY = "EUR";
const SUMUP_API = "https://api.sumup.com/v0.1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), plan: z.enum(["monthly", "yearly"]) }),
  z.object({ action: z.literal("verify"), checkout_id: z.string().min(1).max(100) }),
  z.object({ action: z.literal("start_trial") }),
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("SUMUP_API_KEY")?.trim();
  const merchantCode = Deno.env.get("SUMUP_MERCHANT_CODE")?.trim();
  if (!apiKey || !merchantCode) return json({ error: "SumUp non configurato" }, 500);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return json({ error: "Accesso richiesto" }, 401);
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user?.email) return json({ error: "Accesso richiesto" }, 401);
  const email = userData.user.email.toLowerCase();

  const { data: profile } = await admin
    .from("profiles").select("id, total_paid, balance, trial_start, subscription_end, subscription_status")
    .or(`user_id.eq.${userData.user.id},email.eq.${email}`).limit(1).maybeSingle();
  if (!profile) return json({ error: "Profilo non trovato" }, 404);

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const sumupHeaders = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  try {
    if (parsed.data.action === "start_trial") {
      // Prova gratuita 7 giorni: una sola volta per utente, decisa lato server.
      if (profile.trial_start) return json({ error: "Prova gratuita già utilizzata" }, 409);
      if (profile.subscription_status === "active") return json({ error: "Premium già attivo" }, 409);
      const now = new Date();
      const end = new Date(now.getTime() + 7 * 86400000);
      const { error: upErr } = await admin.from("profiles").update({
        plan: "trial", subscription_status: "in_trial",
        trial_start: now.toISOString(), trial_end: end.toISOString(),
        subscription_start: now.toISOString(), subscription_end: end.toISOString(),
        next_billing_date: end.toISOString(),
      }).eq("id", profile.id).is("trial_start", null);
      if (upErr) throw upErr;
      return json({ premium: true, plan: "trial", trial_end: end.toISOString() });
    }

    if (parsed.data.action === "create") {
      const plan = PLANS[parsed.data.plan];
      const siteUrl = Deno.env.get("SITE_URL") || "https://speaklivetranslate.it";
      const reference = `stl-${parsed.data.plan}-${profile.id}-${Date.now()}`;
      const res = await fetch(`${SUMUP_API}/checkouts`, {
        method: "POST",
        headers: sumupHeaders,
        body: JSON.stringify({
          checkout_reference: reference,
          amount: plan.amount,
          currency: CURRENCY,
          merchant_code: merchantCode,
          description: `Speak & Translate Live ${plan.label}`,
          redirect_url: `${siteUrl}/success`,
          hosted_checkout: { enabled: true },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[sumup-checkout] create failed", res.status, data);
        return json({ error: "Creazione checkout SumUp fallita" }, 502);
      }
      const checkoutUrl = data.hosted_checkout_url;
      if (!checkoutUrl) return json({ error: "URL checkout SumUp mancante" }, 502);
      return json({ checkout_url: checkoutUrl, checkout_id: data.id });
    }

    // verify
    const res = await fetch(`${SUMUP_API}/checkouts/${encodeURIComponent(parsed.data.checkout_id)}`, { headers: sumupHeaders });
    const co = await res.json().catch(() => ({}));
    if (!res.ok) return json({ status: "unknown", error: "Checkout non trovato" }, 404);

    const ref: string = co.checkout_reference || "";
    const m = ref.match(/^stl-(monthly|yearly)-([0-9a-f-]{36})-\d+$/);
    if (!m || m[2] !== profile.id) return json({ status: "invalid", error: "Checkout non associato a questo utente" }, 403);
    const plan = PLANS[m[1] as "monthly" | "yearly"];
    if (co.status !== "PAID") return json({ status: co.status || "PENDING", premium: false });
    if (Number(co.amount) !== plan.amount || co.currency !== CURRENCY || co.merchant_code !== merchantCode) {
      return json({ status: "invalid", error: "Importo o valuta non corrispondenti" }, 400);
    }

    const { data: existing } = await admin.from("user_payment_transactions").select("id").eq("reference", ref).maybeSingle();
    if (!existing) {
      const now = new Date();
      // Rinnovo: i giorni residui (prova o periodo pagato) non si perdono, il nuovo periodo parte dalla scadenza attuale.
      const curEnd = profile.subscription_end ? new Date(profile.subscription_end) : null;
      const end = new Date(curEnd && curEnd > now ? curEnd : now);
      end.setMonth(end.getMonth() + plan.months);
      const { error: txErr } = await admin.from("user_payment_transactions").insert({
        user_id: profile.id, description: `SumUp ${plan.label}`, amount: plan.amount,
        status: "completed", reference: ref, plan_type: plan.planType,
      });
      if (txErr && !String(txErr.message).includes("duplicate")) throw txErr;
      if (!txErr) {
        await admin.from("profiles").update({
          plan: plan.planType, subscription_status: "active", billing_provider: "sumup",
          subscription_end: end.toISOString(),
          next_billing_date: end.toISOString(),
          total_paid: Number(profile.total_paid || 0) + plan.amount,
          balance: Number(profile.balance || 0) + plan.amount,
        }).eq("id", profile.id);
        fetch(`${url}/functions/v1/notify-admin`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({
            appKey: "speak_translate_live", appName: "Speak & Translate Live", eventType: "new_payment",
            idempotencyKey: `sumup-${co.id}`, environment: "production",
            data: { email, plan: m[1], amount: plan.amount, currency: CURRENCY, subscription_status: "active" },
          }),
        }).catch(() => {});
      }
    }
    return json({ status: "PAID", premium: true, plan: plan.planType });
  } catch (err) {
    console.error("[sumup-checkout] error", err);
    return json({ error: "Errore interno" }, 500);
  }
});
