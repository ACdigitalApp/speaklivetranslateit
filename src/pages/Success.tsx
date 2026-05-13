import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Success() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="min-h-[100dvh] bg-vox-page flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check size={32} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold">Pagamento completato</h1>
          <p className="text-sm text-muted-foreground">
            Grazie! La tua iscrizione a Speak & Translate Live Premium è in fase di attivazione.
            Riceverai conferma via email a breve.
          </p>
          {sessionId && (
            <p className="text-[10px] text-muted-foreground break-all">Ref: {sessionId}</p>
          )}
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/settings')}>Vai alle Impostazioni</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Torna alla Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
