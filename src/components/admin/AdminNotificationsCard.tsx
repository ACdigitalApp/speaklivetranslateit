import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

interface NotifRow {
  id: string;
  app_key: string;
  event_type: string;
  status: string;
  created_at: string;
  error: string | null;
}

export function AdminNotificationsCard() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAdmin = currentUser?.role === "admin";
  const [rows, setRows] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("admin_notification_log")
        .select("id, app_key, event_type, status, created_at, error")
        .order("created_at", { ascending: false })
        .limit(15);
      if (mounted) {
        setRows((data as NotifRow[] | null) ?? []);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const statusVariant = (s: string): "default" | "secondary" | "destructive" =>
    s === "sent" ? "default" : s === "failed" ? "destructive" : "secondary";

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">📬 Ultime notifiche admin (Resend)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna notifica ancora.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 py-1.5 border-b last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant="outline" className="shrink-0">{r.app_key}</Badge>
                  <span className="font-mono text-xs truncate">{r.event_type}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("it-IT")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
