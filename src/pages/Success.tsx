import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verifySumUpCheckout } from '@/services/billing/providers/sumupProvider';

export default function Success() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const checkoutId = params.get('checkout_id');
  const [state, setState] = useState<'checking' | 'paid' | 'pending' | 'error'>('checking');

  useEffect(() => {
    let tries = 0;
    let timer: number | undefined;
    const run = async () => {
      try {
        const r = await verifySumUpCheckout(checkoutId);
        if (r.premium) return setState('paid');
        if (r.status === 'none' || r.status === 'FAILED' || r.status === 'invalid') return setState('error');
        if (++tries < 6) timer = window.setTimeout(run, 3000);
        else setState('pending');
      } catch {
        setState('error');
      }
    };
    run();
    return () => window.clearTimeout(timer);
  }, [checkoutId]);

  const title = { checking: 'Verifica pagamento…', paid: 'Pagamento completato', pending: 'Pagamento in attesa', error: 'Pagamento non verificato' }[state];
  const text = {
    checking: 'Stiamo verificando il pagamento con SumUp.',
    paid: 'Grazie! Premium è stato attivato sul tuo account.',
    pending: 'SumUp non ha ancora confermato il pagamento. Riprova tra qualche minuto.',
    error: 'Non risulta un pagamento completato. Premium non è stato attivato.',
  }[state];

  return (
    <div className="min-h-[100dvh] bg-vox-page flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            {state === 'checking' ? <Loader2 size={32} className="text-primary animate-spin" />
              : state === 'paid' ? <Check size={32} className="text-primary" />
              : <X size={32} className="text-destructive" />}
          </div>
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{text}</p>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/settings')}>Vai alle Impostazioni</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Torna alla Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
