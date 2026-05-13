// Edge function: notify-admin
// Invia una email admin tramite Resend con protezione anti-duplicati.
// Hardening: whitelist event_type/app_key, validazione idempotency_key,
// payload ridotto a campi essenziali, soft origin check.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "acdigital.app@gmail.com";
// Per usare no-reply@acdigitalapp.it verificare prima il dominio su Resend e poi sostituire FROM.
const FROM = "AC Digital App <onboarding@resend.dev>";

const ALLOWED_EVENTS = new Set([
  "new_signup",
  "new_payment",
  "new_subscription",
  "free_plan_selected",
  "payment_failed",
]);
const ALLOWED_APP_KEYS = new Set(["speak_translate_live", "speaklivetranslate"]);
const IDEMPOTENCY_RE = /^[A-Za-z0-9._-]{1,120}$/;

const ALLOWED_ORIGIN_HOSTS = [
  "speaklivetranslate.it",
  "www.speaklivetranslate.it",
  "speaklivetranslateit.lovable.app",
  "localhost",
  "127.0.0.1",
];
const ALLOWED_ORIGIN_SUFFIXES = [".lovable.app", ".lovableproject.com"];

const ESSENTIAL_FIELDS = ["email", "plan", "amount", "currency", "environment", "provider", "note", "timestamp", "userId", "name"] as const;

interface Payload {
  appKey: string;
  appName: string;
  eventType: string;
  idempotencyKey: string;
  environment?: "production" | "preview" | "demo";
  data: Record<string, unknown>;
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isOriginAllowed(req: Request): { allowed: boolean; warn: boolean } {
  const origin = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
  if (!origin) return { allowed: true, warn: true }; // soft: permetti curl/test, ma logga
  try {
    const u = new URL(origin);
    if (ALLOWED_ORIGIN_HOSTS.includes(u.hostname)) return { allowed: true, warn: false };
    if (ALLOWED_ORIGIN_SUFFIXES.some((s) => u.hostname.endsWith(s))) return { allowed: true, warn: false };
    return { allowed: false, warn: false };
  } catch {
    return { allowed: false, warn: false };
  }
}

function reduceData(data: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const k of ESSENTIAL_FIELDS) {
    if (k in data) {
      const v = data[k];
      if (v === undefined || v === null) continue;
      // tronca stringhe troppo lunghe
      out[k] = typeof v === "string" ? v.slice(0, 500) : v;
    }
  }
  return out;
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

function buildHtml(p: Payload, reduced: Record<string, unknown>): string {
  const rows = Object.entries(reduced)
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
    // --- Origin/Referer soft check ---
    const originCheck = isOriginAllowed(req);
    if (!originCheck.allowed) {
      return jsonResponse(403, { ok: false, error: "origin_not_allowed" });
    }
    if (originCheck.warn) {
      console.warn("[notify-admin] missing Origin/Referer (allowed for tests)");
    }

    let body: Payload;
    try {
      body = (await req.json()) as Payload;
    } catch {
      return jsonResponse(400, { ok: false, error: "invalid_json" });
    }

    if (!body.appKey || !body.appName || !body.eventType || !body.idempotencyKey) {
      return jsonResponse(400, { ok: false, error: "missing_fields" });
    }

    // --- Whitelist app_key ---
    if (!ALLOWED_APP_KEYS.has(body.appKey)) {
      return jsonResponse(400, { ok: false, error: "invalid_app_key" });
    }

    // --- Whitelist event_type ---
    if (!ALLOWED_EVENTS.has(body.eventType)) {
      return jsonResponse(400, { ok: false, error: "invalid_event_type" });
    }

    // --- Idempotency key validation ---
    if (typeof body.idempotencyKey !== "string" || !IDEMPOTENCY_RE.test(body.idempotencyKey)) {
      return jsonResponse(400, { ok: false, error: "invalid_idempotency_key" });
    }

    // --- App name length cap ---
    const appName = String(body.appName).slice(0, 80);

    const reducedPayload = reduceData(body.data);

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
        payload: reducedPayload,
      });

    if (insertErr) {
      // Codice 23505 = unique violation → duplicato, no-op
      if ((insertErr as { code?: string }).code === "23505") {
        return jsonResponse(200, { ok: true, deduped: true });
      }
      throw insertErr;
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      await supabase
        .from("admin_notification_log")
        .update({ status: "failed", error: "RESEND_API_KEY missing" })
        .eq("app_key", body.appKey)
        .eq("event_type", body.eventType)
        .eq("idempotency_key", body.idempotencyKey);
      return jsonResponse(500, { ok: false, error: "resend_key_missing" });
    }

    const subjectPayload: Payload = { ...body, appName };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: buildSubject(subjectPayload),
        html: buildHtml(subjectPayload, reducedPayload),
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
      return jsonResponse(502, { ok: false, error: "resend_send_failed" });
    }

    return jsonResponse(200, { ok: true });
  } catch (e) {
    console.error("[notify-admin] error", e);
    return jsonResponse(500, { ok: false, error: (e as Error).message });
  }
});
