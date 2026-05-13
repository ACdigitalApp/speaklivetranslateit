import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Star, Zap, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const features = [
  { name: 'Traduzioni vocali live', free: '5/giorno', premium: 'Illimitate' },
  { name: 'Traduzioni foto', free: '2/giorno', premium: 'Illimitate' },
  { name: 'Traduzioni PDF', free: '1/giorno', premium: 'Illimitate' },
  { name: 'Cronologia traduzioni', free: 'Ultime 10', premium: 'Completa' },
  { name: 'Accesso premium', free: '—', premium: '✓' },
  { name: 'Supporto prioritario', free: '—', premium: '✓' },
];

const faqs = [
  { q: 'Come funziona la prova gratuita?', a: 'Hai 7 giorni di accesso completo a tutte le funzionalità premium. Non serve carta di credito per iniziare.' },
  { q: 'Posso annullare?', a: 'Sì, puoi annullare in qualsiasi momento dalla sezione Impostazioni. Non ci sono vincoli.' },
  { q: 'Cosa succede alla scadenza?', a: 'Al termine del trial o dell\'abbonamento, torni al piano Free con funzionalità base.' },
  { q: 'Posso passare da mensile ad annuale?', a: 'Sì, puoi cambiare piano in qualsiasi momento dalla sezione Impostazioni o dalla pagina Upgrade.' },
];

export default function Pricing() {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const currentPlan = currentUser?.plan || 'free';
  const [loadingPlan, setLoadingPlan] = useState<'monthly' | 'yearly' | null>(null);

  const startStripeCheckout = async (plan: 'monthly' | 'yearly') => {
    setLoadingPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: { plan, email: currentUser?.email },
      });
      if (error) throw error;
      const url = (data as any)?.checkout_url;
      if (!url) throw new Error('checkout_url mancante');
      window.location.href = url;
    } catch (err: any) {
      console.error('[stripe-checkout] error', err);
      toast.error('Checkout non disponibile al momento. Riprova tra poco.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Indietro
        </Button>

        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Sblocca SpeakLiveTranslate <span className="text-primary">Premium</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            Traduzioni vocali, foto e PDF senza limiti
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/checkout?plan=trial')}>
              <Zap size={18} className="mr-2" /> Prova 7 giorni gratis
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}>
              Scopri i piani
            </Button>
          </div>
        </div>

        {/* Plans */}
        <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Free */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star size={20} /> Free</CardTitle>
              <CardDescription>Per iniziare</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">€0</p>
              <p className="text-sm text-muted-foreground mb-4">per sempre</p>
              {currentPlan === 'free' && <Badge className="mb-3 bg-primary/10 text-primary border-primary/30">Piano attuale</Badge>}
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> 5 traduzioni vocali/giorno</li>
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> 2 traduzioni foto/giorno</li>
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> 1 traduzione PDF/giorno</li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>Continua con Free</Button>
            </CardContent>
          </Card>

          {/* Monthly */}
          <Card className="relative border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Crown size={20} className="text-primary" /> Premium Monthly</CardTitle>
              <CardDescription>Accesso completo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">€7,99</p>
              <p className="text-sm text-muted-foreground mb-4">al mese</p>
              {currentPlan === 'premium_monthly' && <Badge className="mb-3 bg-primary/10 text-primary border-primary/30">Piano attuale</Badge>}
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> Traduzioni illimitate</li>
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> Foto e PDF illimitati</li>
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> Cronologia completa</li>
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> Supporto prioritario</li>
              </ul>
              <Button className="w-full" disabled={loadingPlan !== null} onClick={() => startStripeCheckout('monthly')}>
                {loadingPlan === 'monthly' ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Passa al Mensile
              </Button>
            </CardContent>
          </Card>

          {/* Yearly */}
          <Card className="relative border-primary shadow-md">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Più conveniente</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Crown size={20} className="text-primary" /> Premium Yearly</CardTitle>
              <CardDescription>Risparmia il 48%</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold mb-1">€49,99</p>
              <p className="text-sm text-muted-foreground mb-4">all'anno</p>
              {currentPlan === 'premium_yearly' && <Badge className="mb-3 bg-primary/10 text-primary border-primary/30">Piano attuale</Badge>}
              <Badge variant="outline" className="mb-3 bg-amber-50 text-amber-700 border-amber-200">7 giorni gratis</Badge>
              <ul className="space-y-2 text-sm mb-6">
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> Tutto del Monthly</li>
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> Risparmi €45,89/anno</li>
                <li className="flex gap-2"><Check size={16} className="text-primary shrink-0 mt-0.5" /> Funzionalità esclusive</li>
              </ul>
              <Button className="w-full" disabled={loadingPlan !== null} onClick={() => startStripeCheckout('yearly')}>
                {loadingPlan === 'yearly' ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                Passa all'Annuale
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Comparison */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Confronto Funzionalità</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Funzionalità</th>
                    <th className="text-center py-2 px-4">Free</th>
                    <th className="text-center py-2 px-4">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map(f => (
                    <tr key={f.name} className="border-b last:border-0">
                      <td className="py-2.5 pr-4">{f.name}</td>
                      <td className="text-center py-2.5 px-4 text-muted-foreground">{f.free}</td>
                      <td className="text-center py-2.5 px-4 font-medium text-primary">{f.premium}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Domande Frequenti</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-sm">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
