// Edge function: sumup-renewal-reminders
// Job giornaliero: trova gli abbonamenti Premium in scadenza (tra 3 giorni o scaduti da poco),
// crea un checkout SumUp di rinnovo per l'utente e gli invia un'email con il link di pagamento.
// Idempotente: un solo promemoria per utente per periodo di scadenza (admin_notification_log).
// Chiamabile solo con la service role key (da pg_cron), mai dagli utenti.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUMUP_API = "https://api.sumup.com/v0.1";
const CURRENCY = "EUR";
const REMIND_DAYS_BEFORE = 3;

const PLANS = {
  premium_monthly: { amount: 7.99, plan: "monthly", label: "Premium Monthly" },
  premium_yearly: { amount: 49.99, plan: "yearly", label: "Premium Yearly" },
} as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Solo chiamate server-to-server (cron) con la service role key.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (auth !== serviceKey) return json({ error: "Non autorizzato" }, 401);

  const sumupKey = Deno.env.get("SUMUP_API_KEY")?.trim();
  const merchantCode = Deno.env.get("SUMUP_MERCHANT_CODE")?.trim();
  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!sumupKey || !merchantCode || !resendKey) return json({ error: "Configurazione mancante" }, 500);

  const url = Deno.env.get("SUPABASE_URL")!;
  const siteUrl = Deno.env.get("SITE_URL") || "https://speaklivetranslate.it";
  const admin = createClient(url, serviceKey);

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMIND_DAYS_BEFORE * 86400000);

  // Abbonamenti attivi o in prova che scadono entro 3 giorni (o scaduti da max 7 giorni).
  const expiredSince = new Date(now.getTime() - 7 * 86400000);
  const { data: expiring, error } = await admin
    .from("profiles")
    .select("id, email, name, plan, subscription_status, subscription_end")
    .is("deleted_at", null)
    .in("subscription_status", ["active", "in_trial", "trialing"])
    .gte("subscription_end", expiredSince.toISOString())
    .lte("subscription_end", windowEnd.toISOString());
  if (error) return json({ error: error.message }, 500);

  const results: { email: string; status: string }[] = [];

  for (const p of expiring || []) {
    const endStr = (p.subscription_end || "").slice(0, 10);
    const idem = `renewal-${p.id}-${endStr}`;
    try {
      // Idempotenza: già inviato per questa scadenza?
      const { data: already } = await admin
        .from("admin_notification_log")
        .select("id")
        .eq("app_key", "speak_translate_live")
        .eq("event_type", "renewal_reminder")
        .eq("idempotency_key", idem)
        .maybeSingle();
      if (already) { results.push({ email: p.email, status: "already_sent" }); continue; }

      // Piano di rinnovo: stesso piano attuale, default mensile per chi esce dalla prova.
      const planCfg = PLANS[p.plan as keyof typeof PLANS] || PLANS.premium_monthly;

      // Crea checkout SumUp di rinnovo.
      const reference = `stl-${planCfg.plan}-${p.id}-${Date.now()}`;
      const coRes = await fetch(`${SUMUP_API}/checkouts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${sumupKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_reference: reference,
          amount: planCfg.amount,
          currency: CURRENCY,
          merchant_code: merchantCode,
          description: `Speak & Translate Live ${planCfg.label} - Rinnovo`,
          redirect_url: `${siteUrl}/success`,
          hosted_checkout: { enabled: true },
        }),
      });
      const co = await coRes.json().catch(() => ({}));
      if (!coRes.ok || !co.hosted_checkout_url) throw new Error(`SumUp checkout failed: ${coRes.status}`);

      // Invia email con il link di rinnovo.
      const endDate = new Date(p.subscription_end).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
      const mailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Speak & Translate Live <noreply@speaklivetranslate.it>",
          to: [p.email],
          subject: "Il tuo abbonamento sta per scadere — rinnova con un clic",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px">
              <h2 style="color:#2D6A4F">Ciao ${p.name || ""}!</h2>
              <p>Il tuo abbonamento a <strong>Speak &amp; Translate Live</strong> scade il <strong>${endDate}</strong>.</p>
              <p>Rinnova ora con un clic: i giorni che ti restano non vanno persi, il nuovo periodo parte dalla scadenza attuale.</p>
              <p style="text-align:center;margin:32px 0">
                <a href="${co.hosted_checkout_url}" style="background:#2D6A4F;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
                  Rinnova ${planCfg.label} — €${planCfg.amount.toFixed(2)}
                </a>
              </p>
              <p style="color:#666;font-size:13px">Se il pulsante non funziona, copia questo link nel browser:<br>${co.hosted_checkout_url}</p>
              <p style="color:#999;font-size:12px">Speak &amp; Translate Live — by AC Digital App</p>
            </div>`,
        }),
      });
      if (!mailRes.ok) throw new Error(`Resend failed: ${mailRes.status}`);

      await admin.from("admin_notification_log").insert({
        app_key: "speak_translate_live",
        event_type: "renewal_reminder",
        idempotency_key: idem,
        recipient: p.email,
        status: "sent",
        payload: { plan: planCfg.plan, checkout_id: co.id, subscription_end: p.subscription_end },
      });
      results.push({ email: p.email, status: "sent" });
    } catch (err) {
      console.error("[renewal] failed for", p.email, err);
      await admin.from("admin_notification_log").insert({
        app_key: "speak_translate_live",
        event_type: "renewal_reminder",
        idempotency_key: idem,
        recipient: p.email,
        status: "error",
        error: String(err),
      }).catch(() => {});
      results.push({ email: p.email, status: "error" });
    }
  }

  return json({ checked: (expiring || []).length, results });
});
