// Client helper: invia notifica admin via edge function `notify-admin`.
// Fail-silent: non blocca mai il flusso utente.
import { supabase } from "@/integrations/supabase/client";

const APP_KEY = "speak_translate_live"; // whitelist edge function
const APP_NAME = "Speak & Translate Live";

function getEnvironment(): "production" | "preview" | "demo" {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  if (host.includes("speaklivetranslate.it")) return "production";
  if (host.includes("lovable")) return "preview";
  return "demo";
}

export type AdminEventType =
  | "new_signup"
  | "new_payment"
  | "new_subscription"
  | "trial_started"
  | "trial_invoice_paid"
  | "free_plan_selected"
  | "payment_failed";

export async function notifyAdmin(
  eventType: AdminEventType,
  idempotencyKey: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.functions.invoke("notify-admin", {
      body: {
        appKey: APP_KEY,
        appName: APP_NAME,
        eventType,
        idempotencyKey,
        environment: getEnvironment(),
        data,
      },
    });
  } catch (err) {
    // Mai bloccare il flusso utente per un errore di notifica admin.
    console.warn("[notifyAdmin] failed (non-blocking):", err);
  }
}
