import { useState, useEffect } from 'react';
import { User, LogOut, Key, Download, Crown, ArrowUpRight, Globe, Smartphone, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { RoleBadge } from '@/components/auth/RoleBadge';
import { PlanBadge, StatusBadge } from '@/components/subscription/PlanBadge';
import { useAuthStore } from '@/store/useAuthStore';
import { useBilling } from '@/hooks/useBilling';
import { getProviderLabel, getManageLabel } from '@/config/subscriptions';
import { toast } from 'sonner';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { activeProvider, isMock, platform, restorePurchases, loading } = useBilling();
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleInstall = async () => {
    if (installPrompt) { installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }
  };

  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result?.success) toast.success(result.message);
    else toast.info(result?.message || 'Nessun acquisto da ripristinare.');
  };

  if (!currentUser) return null;

  const initials = currentUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const fmtDate = (d?: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  const isPremium = currentUser.plan === 'premium_monthly' || currentUser.plan === 'premium_yearly';
  const isTrial = currentUser.plan === 'trial';
  const showRestore = platform === 'ios' || platform === 'android';
  const billingProvider = (currentUser as any).billingProvider || activeProvider;

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <PageHeader title="Impostazioni" subtitle="Gestisci il tuo profilo e preferenze" />

        <div className="space-y-6">
          {/* Profilo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User size={20} className="text-primary" /> Profilo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 cursor-pointer">
                  <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{currentUser.name}</p>
                  <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Clicca sulla foto per modificarla</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={currentUser.email} readOnly className="bg-muted/50" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setPwOpen(true)} className="flex-1">
                  <Key size={16} className="mr-2" /> Cambia Password
                </Button>
                <Button variant="destructive" onClick={handleLogout} className="flex-1">
                  <LogOut size={16} className="mr-2" /> Esci
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Abbonamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Crown size={20} className="text-primary" /> Abbonamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-medium">Piano corrente:</p>
                <PlanBadge plan={currentUser.plan} />
                <StatusBadge status={currentUser.subscriptionStatus} />
                <Badge variant="outline" className="text-xs bg-muted">
                  {billingProvider === 'stripe' && <Globe size={10} className="mr-1" />}
                  {(billingProvider === 'apple' || billingProvider === 'googleplay') && <Smartphone size={10} className="mr-1" />}
                  {getProviderLabel(billingProvider)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Scadenza</p>
                  <p className="font-semibold">{fmtDate(currentUser.subscriptionEnd)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Prossimo Rinnovo</p>
                  <p className="font-semibold">{fmtDate(currentUser.nextBillingDate)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Totale Pagato</p>
                  <p className="font-semibold font-mono">€{currentUser.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Ruolo</p>
                  <RoleBadge role={currentUser.role} />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {currentUser.role === 'admin'
                  ? "Hai accesso completo a tutte le funzionalità dell'applicazione."
                  : isPremium
                  ? 'Il tuo piano Premium è attivo con accesso a tutte le funzionalità.'
                  : isTrial
                  ? 'Stai utilizzando la prova gratuita di 7 giorni.'
                  : "Hai accesso alle funzionalità base dell'applicazione."}
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                {(!isPremium) && (
                  <Button onClick={() => navigate('/upgrade')} className="flex-1">
                    <ArrowUpRight size={16} className="mr-2" /> Passa a Premium
                  </Button>
                )}
                {currentUser.plan === 'premium_monthly' && (
                  <Button onClick={() => navigate('/checkout?plan=premium_yearly')} variant="outline" className="flex-1">
                    <ArrowUpRight size={16} className="mr-2" /> Upgrade Annuale
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate('/pricing')} className="flex-1">
                  {getManageLabel(billingProvider)}
                </Button>
                {showRestore && (
                  <Button variant="outline" onClick={handleRestore} disabled={loading} className="flex-1">
                    <RotateCcw size={14} className="mr-2" /> Ripristina acquisti
                  </Button>
                )}
              </div>

              {/* Provider-specific guidance */}
              {billingProvider === 'apple' && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  Per gestire o annullare il tuo abbonamento, vai su Impostazioni iPhone → Apple ID → Abbonamenti.
                </p>
              )}
              {billingProvider === 'googleplay' && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  Per gestire o annullare il tuo abbonamento, apri Google Play Store → Menu → Abbonamenti.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Installa App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download size={20} className="text-primary" /> Installa App</CardTitle>
              <CardDescription>Installa l'app sul tuo dispositivo per un accesso più rapido</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleInstall} disabled={!installPrompt} variant="outline" className="w-full sm:w-auto">
                <Download size={16} className="mr-2" />
                {installPrompt ? 'Installa App' : 'Installazione non disponibile'}
              </Button>
              {!installPrompt && (
                <p className="text-xs text-muted-foreground mt-2">L'app potrebbe già essere installata o il browser non supporta l'installazione PWA.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={(open) => { setPwOpen(open); if (!open) { setPwForm({ current: '', next: '', confirm: '' }); setPwError(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambia Password</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Password attuale</Label>
              <Input type="password" value={pwForm.current} onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <Label>Nuova password</Label>
              <Input type="password" value={pwForm.next} onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))} placeholder="Minimo 8 caratteri" />
            </div>
            <div className="space-y-1">
              <Label>Conferma nuova password</Label>
              <Input type="password" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} placeholder="Ripeti la nuova password" />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2">
              🧪 <strong>Modalità Demo</strong>: il cambio password è simulato e non ha effetto reale.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwOpen(false); setPwForm({ current: '', next: '', confirm: '' }); setPwError(''); }}>Annulla</Button>
            <Button onClick={() => {
              if (!pwForm.current) { setPwError('Inserisci la password attuale'); return; }
              if (pwForm.next.length < 8) { setPwError('La nuova password deve avere almeno 8 caratteri'); return; }
              if (pwForm.next !== pwForm.confirm) { setPwError('Le password non coincidono'); return; }
              toast.success('Password aggiornata con successo (demo)');
              setPwOpen(false);
              setPwForm({ current: '', next: '', confirm: '' });
              setPwError('');
            }}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
