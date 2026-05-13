import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Zap, ArrowLeft, RotateCcw, Smartphone, Globe, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useBilling } from '@/hooks/useBilling';
import { toast } from 'sonner';

const benefits = [
  'Traduzioni vocali illimitate',
  'Traduzioni foto e PDF senza limiti',
  'Cronologia completa delle traduzioni',
  'Supporto prioritario',
  'Aggiornamenti anticipati',
  'Nessuna pubblicità',
];

export default function Upgrade() {
  const navigate = useNavigate();
  const currentUser = useAuthStore(s => s.currentUser);
  const { activeProvider, ctaLabel, isMock, isAvailable, unavailableMessage, startPurchase, restorePurchases, loading, platform } = useBilling();
  const [restoring, setRestoring] = useState(false);
  const plan = currentUser?.plan || 'free';

  const handlePurchase = async (planId: string) => {
    if (!isAvailable && !isMock) {
      toast.error(unavailableMessage);
      return;
    }
    if (isMock) {
      navigate(`/checkout?plan=${planId}`);
      return;
    }
    try {
      const result = await startPurchase(planId);
      if (result?.status === 'completed') {
        toast.success('Acquisto completato!');
        navigate('/settings');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Errore apertura checkout. Riprova.');
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    if (result?.success) toast.success(result.message);
    else toast.info(result?.message || 'Nessun acquisto da ripristinare.');
    setRestoring(false);
  };

  const showRestore = platform === 'ios' || platform === 'android';

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Indietro
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Crown size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Passa a Premium</h1>
          <p className="text-muted-foreground">Sblocca tutte le funzionalità di SpeakLiveTranslate</p>
          {isMock && (
            <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200">
              <AlertCircle size={12} className="mr-1" /> Modalità demo attiva
            </Badge>
          )}
        </div>

        {/* Benefits */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Vantaggi Premium</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {benefits.map(b => (
                <li key={b} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-primary" />
                  </div>
                  {b}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {isMock && (
            <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handlePurchase('trial')}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold text-sm">Prova Gratuita</p>
                  <p className="text-xs text-muted-foreground">7 giorni gratis, poi scegli un piano</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">€0,00</p>
                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">7 giorni</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => handlePurchase('premium_monthly')}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-sm">Premium Monthly</p>
                <p className="text-xs text-muted-foreground">Rinnovo mensile</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">€7,99/mese</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-primary transition-colors border-primary/30 relative" onClick={() => handlePurchase('premium_yearly')}>
            <div className="absolute -top-2.5 right-4">
              <Badge className="bg-primary text-primary-foreground text-xs">Più conveniente</Badge>
            </div>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-sm">Premium Yearly</p>
                <p className="text-xs text-muted-foreground">Risparmia il 48%</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">€49,99/anno</p>
                <p className="text-xs text-muted-foreground line-through">€95,88</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Provider info */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {activeProvider === 'stripe' && <Globe size={14} className="text-muted-foreground" />}
          {(activeProvider === 'apple' || activeProvider === 'googleplay') && <Smartphone size={14} className="text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{ctaLabel}</span>
        </div>

        {showRestore && (
          <Button variant="outline" className="w-full mb-3" onClick={handleRestore} disabled={restoring}>
            <RotateCcw size={14} className="mr-2" /> Ripristina acquisti
          </Button>
        )}

        {!isAvailable && !isMock && unavailableMessage && (
          <p className="text-xs text-center text-amber-600 mb-4 bg-amber-50 rounded-lg p-3">{unavailableMessage}</p>
        )}

        <Button variant="ghost" className="w-full text-muted-foreground" onClick={async () => {
          if (currentUser?.email) {
            const day = new Date().toISOString().slice(0, 10);
            const key = `free-${currentUser.id || currentUser.email}-${day}`.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120);
            const { notifyAdmin } = await import('@/lib/notifyAdmin');
            notifyAdmin('free_plan_selected', key, {
              email: currentUser.email,
              name: currentUser.name,
              plan: 'free',
              note: 'source=upgrade',
            });
          }
          navigate('/');
        }}>
          Continua con Free
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-4">
          {isMock ? 'Checkout dimostrativo: nessun addebito reale verrà effettuato.' : 'Checkout sicuro gestito da ' + ctaLabel.split(' ').pop() + '.'}
          {' '}Potrai gestire il tuo piano dalla sezione Impostazioni.
        </p>
      </div>
    </div>
  );
}
