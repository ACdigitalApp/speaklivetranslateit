// Edge function: notify-admin
// Invia una email admin tramite Resend con protezione anti-duplicati.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "acdigital.app@gmail.com";
const FROM = "AC Digital App <onboarding@resend.dev>";

interface Payload {
  appKey: string;
  appName: string;
  eventType: "new_signup" | "new_payment" | "new_subscription";
  idempotencyKey: string;
  environment?: "production" | "preview" | "demo";
  data: Record<string, unknown>;
}

function buildSubject(p: Payload): string {
  const label =
    p.eventType === "new_signup"
      ? "Nuova iscrizione"
      : p.eventType === "new_payment"
      ? "Pagamento riuscito"
      : "Nuovo abbonamento";
  return `[${p.appName}] ${label}`;
}

function buildHtml(p: Payload): string {
  const rows = Object.entries(p.data)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;color:#666;border-bottom:1px solid #eee">${k}</td><td style="padding:6px 12px;border-bottom:1px solid #eee"><strong>${String(
          v,
        )}</strong></td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="color:#2D6A4F">${buildSubject(p)}</h2>
    <p style="color:#444">App: <strong>${p.appName}</strong> · Ambiente: <strong>${
    p.environment ?? "production"
  }</strong></p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">${rows}
      <tr><td style="padding:6px 12px;color:#666">event</td><td style="padding:6px 12px"><strong>${
        p.eventType
      }</strong></td></tr>
      <tr><td style="padding:6px 12px;color:#666">timestamp</td><td style="padding:6px 12px">${new Date().toISOString()}</td></tr>
      <tr><td style="padding:6px 12px;color:#666">idempotency_key</td><td style="padding:6px 12px"><code>${
        p.idempotencyKey
      }</code></td></tr>
    </table>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body.appKey || !body.appName || !body.eventType || !body.idempotencyKey) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Anti-duplicati: tenta INSERT pending; se conflict → già inviata
    const { error: insertErr } = await supabase
      .from("admin_notification_log")
      .insert({
        app_key: body.appKey,
        event_type: body.eventType,
        idempotency_key: body.idempotencyKey,
        recipient: ADMIN_EMAIL,
        status: "pending",
        payload: body.data ?? {},
      });

    if (insertErr) {
      // Codice 23505 = unique violation → duplicato, no-op
      if ((insertErr as { code?: string }).code === "23505") {
        return new Response(JSON.stringify({ ok: true, deduped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertErr;
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: buildSubject(body),
        html: buildHtml(body),
      }),
    });

    const out = await res.json().catch(() => ({}));

    await supabase
      .from("admin_notification_log")
      .update({
        status: res.ok ? "sent" : "failed",
        error: res.ok ? null : JSON.stringify(out).slice(0, 500),
      })
      .eq("app_key", body.appKey)
      .eq("event_type", body.eventType)
      .eq("idempotency_key", body.idempotencyKey);

    if (!res.ok) {
      console.error("[notify-admin] resend error", out);
      return new Response(JSON.stringify({ ok: false, error: out }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[notify-admin] error", e);
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
