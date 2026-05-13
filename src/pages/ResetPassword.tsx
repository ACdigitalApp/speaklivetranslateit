// TAPPA 1 — file minimale NON collegato al router.
// Verrà attivato nella tappa finale insieme allo switch ad Auth reale.
// Quando attivato:
// 1. Aggiungere <Route path="/reset-password" element={<ResetPassword />} /> in src/main.tsx
// 2. Verificare che la pagina /login chiami:
//    supabase.auth.resetPasswordForEmail(email, {
//      redirectTo: `${window.location.origin}/reset-password`,
//    });
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // L'hash contiene type=recovery quando l'utente arriva dal link email.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    setIsRecovery(hash.includes("type=recovery"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setMessage("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setMessage("Le password non coincidono.");
      return;
    }
    setStatus("loading");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setStatus("ok");
    setMessage("Password aggiornata. Ora puoi accedere.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Reimposta password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Inserisci la nuova password per il tuo account Speak &amp; Translate Live.
        </p>

        {!isRecovery && (
          <p className="mt-4 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Questa pagina funziona solo aprendo il link "Reimposta password" ricevuto via email.
          </p>
        )}

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Nuova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            autoComplete="new-password"
            required
          />
          <input
            type="password"
            placeholder="Conferma password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            autoComplete="new-password"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {status === "loading" ? "Aggiornamento..." : "Aggiorna password"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-3 text-sm ${
              status === "error" ? "text-destructive" : "text-foreground"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
