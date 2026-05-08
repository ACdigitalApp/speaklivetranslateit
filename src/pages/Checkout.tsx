import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Shield, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubscriptionStore, PLAN_PRICES } from '@/store/useSubscriptionStore';
import type { PlanType } from '@/types/auth';
import { toast } from 'sonner';

const planNames: Partial<Record<PlanType, string>> = {
  free: 'Free',
  trial: 'Prova Gratuita 7 giorni',
  premium_monthly: 'Premium Monthly',
  premium_yearly: 'Premium Yearly',
};

const planDescriptions: Partial<Record<PlanType, string>> = {
  free: '',
  trial: 'Oggi non paghi nulla. La tua prova gratuita dura 7 giorni.',
  premium_monthly: 'Confermando, attivi SpeakLiveTranslate Premium Monthly a €7,99 al mese.',
  premium_yearly: 'Confermando, attivi SpeakLiveTranslate Premium Yearly a €49,99 all\'anno.',
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planParam = (searchParams.get('plan') || 'trial') as PlanType;
  const plan = ['trial', 'premium_monthly', 'premium_yearly'].includes(planParam) ? planParam : 'trial';

  const currentUser = useAuthStore(s => s.currentUser);
  const completeMockCheckout = useSubscriptionStore(s => s.completeMockCheckout);

  const [form, setForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    whatsapp: currentUser?.whatsapp || '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    country: 'Italia',
    terms: false,
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const price = PLAN_PRICES[plan];
  const isTrial = plan === 'trial';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.terms) { toast.error('Accetta i termini per procedere'); return; }
    if (!isTrial && (!form.cardNumber || !form.cardExpiry || !form.cardCvv)) {
      toast.error('Compila i dati di pagamento');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      completeMockCheckout(plan);
      setLoading(false);
      setSuccess(true);
      const msg = isTrial
        ? 'Trial attivato con successo.'
        : plan === 'premium_monthly'
        ? 'Pagamento simulato completato. Piano mensile attivato.'
        : 'Pagamento simulato completato. Piano annuale attivato.';
      toast.success(msg);
    }, 1200);
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-vox-page flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check size={32} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold">
              {isTrial ? 'Trial attivato con successo!' : 'Pagamento completato!'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isTrial
                ? 'La tua prova gratuita di 7 giorni è ora attiva.'
                : `Il tuo piano ${planNames[plan]} è ora attivo.`}
            </p>
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={() => navigate(currentUser?.role === 'admin' ? '/admin/users' : '/settings')}>
                Vai alle Impostazioni
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>Torna alla Home</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Torna ai piani
        </Button>

        <h1 className="text-2xl font-bold mb-1">Checkout</h1>
        <p className="text-muted-foreground text-sm mb-6">Completa il tuo upgrade a SpeakLiveTranslate Premium</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><CreditCard size={18} /> Riepilogo Ordine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Piano selezionato</span><span className="font-semibold">{planNames[plan]}</span></div>
              <div className="flex justify-between"><span>Prezzo</span><span className="font-semibold">€{price.toFixed(2)}{plan === 'premium_monthly' ? '/mese' : plan === 'premium_yearly' ? '/anno' : ''}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Totale di oggi</span>
                <span className="text-primary">€{price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{planDescriptions[plan]}</p>
            </CardContent>
          </Card>

          {/* Customer info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Dati Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Nome</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="space-y-1"><Label>WhatsApp <span className="text-muted-foreground font-normal">(opzionale)</span></Label><Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} /></div>
            </CardContent>
          </Card>

          {/* Payment info */}
          {!isTrial && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Shield size={18} /> Metodo di Pagamento</CardTitle>
                <CardDescription>Checkout dimostrativo — nessun addebito reale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1"><Label>Nome sulla carta</Label><Input value={form.cardName} onChange={e => setForm(p => ({ ...p, cardName: e.target.value }))} placeholder="Mario Rossi" /></div>
                <div className="space-y-1"><Label>Numero carta</Label><Input value={form.cardNumber} onChange={e => setForm(p => ({ ...p, cardNumber: e.target.value }))} placeholder="4242 4242 4242 4242" maxLength={19} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label>Scadenza</Label><Input value={form.cardExpiry} onChange={e => setForm(p => ({ ...p, cardExpiry: e.target.value }))} placeholder="MM/AA" maxLength={5} /></div>
                  <div className="space-y-1"><Label>CVV</Label><Input value={form.cardCvv} onChange={e => setForm(p => ({ ...p, cardCvv: e.target.value }))} placeholder="123" maxLength={4} type="password" /></div>
                </div>
                <div className="space-y-1"><Label>Paese</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
              </CardContent>
            </Card>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3">
            <Checkbox id="terms" checked={form.terms} onCheckedChange={(v) => setForm(p => ({ ...p, terms: !!v }))} className="mt-0.5" />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              Accetto i termini e le condizioni del servizio. Checkout dimostrativo: nessun addebito reale verrà effettuato. I dati inseriti sono usati solo a scopo demo in questa versione.
            </label>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Elaborazione...' : isTrial ? 'Attiva prova gratuita' : 'Conferma pagamento'}
            </Button>
            <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={() => navigate('/')}>
              Continua con Free
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Checkout dimostrativo: nessun addebito reale verrà effettuato.<br />
            Potrai gestire il tuo piano dalla sezione Impostazioni.
          </p>
        </form>
      </div>
    </div>
  );
}
