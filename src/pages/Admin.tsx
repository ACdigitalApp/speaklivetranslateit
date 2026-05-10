import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import { useNavigate } from 'react-router-dom';
import { Shield, Activity, Info, Landmark, Eye, Plus, CreditCard, ScrollText, RefreshCw, Users, DollarSign, TrendingUp, Globe, Smartphone, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuthStore, getMockUsers } from '@/store/useAuthStore';
import { useSubscriptionStore } from '@/store/useSubscriptionStore';
import type { BankAccount, BankTransaction, AdminLog, PayPalAccount } from '@/types/auth';

export default function Admin() {
  const navigate = useNavigate();
  const { currentUser, guestMode, setGuestMode } = useAuthStore();
  const revSummary = useSubscriptionStore(s => s.getRevenueSummary)();
  const [diagOpen, setDiagOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions] = useState<BankTransaction[]>([]);
  const [logs] = useState<AdminLog[]>([]);
  const [bankFormOpen, setBankFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [bankForm, setBankForm] = useState({ holder: '', bankName: '', iban: '', bic: '', notes: '' });

  const [paypal, setPaypal] = useState<PayPalAccount | null>(null);
  const [paypalFormOpen, setPaypalFormOpen] = useState(false);
  const [paypalForm, setPaypalForm] = useState({ email: '', holder: '', notes: '' });

  const resetBankForm = () => { setBankForm({ holder: '', bankName: '', iban: '', bic: '', notes: '' }); setEditingAccount(null); };

  const handleSaveBank = () => {
    if (!bankForm.holder || !bankForm.iban) return;
    if (editingAccount) {
      setBankAccounts(prev => prev.map(a => a.id === editingAccount.id ? { ...a, ...bankForm } : a));
    } else {
      setBankAccounts(prev => [...prev, { id: Date.now().toString(), ...bankForm, createdAt: new Date().toISOString() }]);
    }
    setBankFormOpen(false);
    resetBankForm();
  };

  const handleEditBank = (account: BankAccount) => {
    setEditingAccount(account);
    setBankForm({ holder: account.holder, bankName: account.bankName, iban: account.iban, bic: account.bic, notes: account.notes || '' });
    setBankFormOpen(true);
  };

  const handleDeleteBank = (id: string) => {
    if (window.confirm('Eliminare questo conto?')) setBankAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleSavePaypal = () => {
    if (!paypalForm.email) return;
    setPaypal({ id: Date.now().toString(), ...paypalForm });
    setPaypalFormOpen(false);
  };

  const handleDeletePaypal = () => {
    if (window.confirm('Eliminare i dati PayPal?')) setPaypal(null);
  };

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PageHeader title="Impostazioni Admin" subtitle="Configurazione avanzata, dati bancari e diagnostica" backTo="/admin/users" actions={
          <Button onClick={() => navigate('/admin/users')} size="sm"><Users size={14} className="mr-1" /> Vai a Gestione Utenti</Button>
        } />

        <div className="space-y-6">
          {/* Revenue overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> Panoramica Ricavi</CardTitle>
              <CardDescription>Riepilogo economico calcolato dai dati utenti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Incasso Totale</p>
                  <p className="text-xl font-bold text-primary">€{revSummary.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Utenti Paganti</p>
                  <p className="text-xl font-bold">{revSummary.payingUsers}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Trial Attive</p>
                  <p className="text-xl font-bold">{revSummary.activeTrials}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Ultimi 30 Giorni</p>
                  <p className="text-xl font-bold">€{revSummary.revenueLast30Days.toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Saldo Totale</p>
                  <p className="text-xl font-bold">€{revSummary.totalBalance.toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Scaduti</p>
                  <p className="text-xl font-bold">{revSummary.expiredSubscriptions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store size={20} className="text-primary" /> Canali di Vendita</CardTitle>
              <CardDescription>Provider di pagamento configurati per piattaforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-primary" />
                    <span className="font-semibold text-sm">Web</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Stripe</Badge>
                  <p className="text-xs text-muted-foreground">
                    {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configurato' : 'Non configurato — modalità demo'}
                  </p>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-primary" />
                    <span className="font-semibold text-sm">iOS</span>
                  </div>
                  <Badge variant="outline" className="text-xs">App Store</Badge>
                  <p className="text-xs text-muted-foreground">Store-ready per pubblicazione</p>
                </div>
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-primary" />
                    <span className="font-semibold text-sm">Android</span>
                  </div>
                  <Badge variant="outline" className="text-xs">Google Play</Badge>
                  <p className="text-xs text-muted-foreground">Store-ready per pubblicazione</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impostazioni Amministratore */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield size={20} className="text-primary" /> Impostazioni Amministratore</CardTitle>
              <CardDescription>Gestione impostazioni globali dell'applicazione</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Modalità Ospite</p>
                  <p className="text-xs text-muted-foreground">
                    {guestMode ? 'Attivata - Accesso ospite consentito' : 'Disattivata - Login obbligatorio'}
                  </p>
                </div>
                <Switch checked={guestMode} onCheckedChange={setGuestMode} />
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-2">Quando attiva:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Gli ospiti vedono solo dati demo/fittizi</li>
                  <li>I dati reali restano protetti</li>
                  <li>Gli ospiti non possono salvare modifiche</li>
                  <li>Utile per dimostrazioni dell'app</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity size={20} className="text-primary" /> Diagnostica</CardTitle>
              <CardDescription>Controlla lo stato dei servizi e dell'applicazione</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setDiagOpen(true)} variant="outline" className="w-full sm:w-auto">
                <Eye size={16} className="mr-2" /> Apri Diagnostica
              </Button>
            </CardContent>
          </Card>

          {/* Informazioni App */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Info size={20} className="text-primary" /> Informazioni App</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Versione</p>
                  <p className="font-semibold">1.0.0</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Build</p>
                  <p className="font-semibold">20260321</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Ambiente</p>
                  <p className="font-semibold capitalize">{import.meta.env.MODE}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dati Bancari */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2"><Landmark size={20} className="text-primary" /> I Miei Dati Bancari</CardTitle>
                  <CardDescription>Gestione coordinate bancarie, PayPal e transazioni — Solo Admin</CardDescription>
                </div>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Area Protetta Admin</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="coordinate">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="coordinate"><CreditCard size={14} className="mr-1" /> Coordinate</TabsTrigger>
                  <TabsTrigger value="transazioni"><ScrollText size={14} className="mr-1" /> Transazioni</TabsTrigger>
                  <TabsTrigger value="log"><RefreshCw size={14} className="mr-1" /> Log</TabsTrigger>
                </TabsList>

                <TabsContent value="coordinate" className="mt-4 space-y-6">
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Coordinate Bancarie</h3>
                    {bankAccounts.length === 0 ? (
                      <div className="text-center py-8 space-y-3 border rounded-lg bg-muted/30">
                        <Landmark size={40} className="mx-auto text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Nessuna coordinata bancaria salvata</p>
                        <Button onClick={() => { resetBankForm(); setBankFormOpen(true); }} size="sm"><Plus size={14} className="mr-1" /> Aggiungi ora</Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <Button size="sm" onClick={() => { resetBankForm(); setBankFormOpen(true); }}><Plus size={14} className="mr-1" /> Aggiungi</Button>
                        </div>
                        {bankAccounts.map(acc => (
                          <div key={acc.id} className="border rounded-lg p-4 space-y-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-sm">{acc.holder}</p>
                                <p className="text-xs text-muted-foreground">{acc.bankName}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleEditBank(acc)}>Modifica</Button>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteBank(acc.id)}>Elimina</Button>
                              </div>
                            </div>
                            <p className="text-xs font-mono">{acc.iban}</p>
                            {acc.bic && <p className="text-xs text-muted-foreground">BIC: {acc.bic}</p>}
                            {acc.notes && <p className="text-xs text-muted-foreground italic">{acc.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm mb-1">Dati PayPal</h3>
                    <p className="text-xs text-muted-foreground mb-3">Email PayPal personale per ricezione pagamenti</p>
                    {!paypal ? (
                      <div className="text-center py-8 space-y-3 border rounded-lg bg-muted/30">
                        <DollarSign size={40} className="mx-auto text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">Nessun account PayPal configurato</p>
                        <Button onClick={() => { setPaypalForm({ email: '', holder: '', notes: '' }); setPaypalFormOpen(true); }} size="sm"><Plus size={14} className="mr-1" /> Aggiungi ora</Button>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{paypal.holder}</p>
                            <p className="text-xs text-muted-foreground font-mono">{paypal.email.replace(/(.{3}).*(@.*)/, '$1•••$2')}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => { setPaypalForm({ email: paypal.email, holder: paypal.holder, notes: paypal.notes || '' }); setPaypalFormOpen(true); }}>Modifica</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleDeletePaypal}>Elimina</Button>
                          </div>
                        </div>
                        {paypal.notes && <p className="text-xs text-muted-foreground italic">{paypal.notes}</p>}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="transazioni" className="mt-4">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <ScrollText size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground">Nessuna transazione registrata</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Data</TableHead><TableHead>Importo</TableHead><TableHead>Descrizione</TableHead><TableHead>Stato</TableHead><TableHead>Riferimento</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{transactions.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="text-xs">{t.date}</TableCell>
                          <TableCell className="text-xs font-mono">€{t.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-xs">{t.description}</TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{t.status}</Badge></TableCell>
                          <TableCell className="text-xs">{t.reference}</TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  )}
                </TabsContent>

                <TabsContent value="log" className="mt-4">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <RefreshCw size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                      <p className="text-muted-foreground">Nessun log disponibile</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Data/Ora</TableHead><TableHead>Utente</TableHead><TableHead>Azione</TableHead><TableHead>Dettaglio</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>{logs.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs">{l.date}</TableCell>
                          <TableCell className="text-xs">{l.user}</TableCell>
                          <TableCell className="text-xs">{l.action}</TableCell>
                          <TableCell className="text-xs">{l.detail}</TableCell>
                        </TableRow>
                      ))}</TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diagnostica Dialog */}
      <Dialog open={diagOpen} onOpenChange={setDiagOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Diagnostica Sistema</DialogTitle>
            <DialogDescription>Stato attuale dell'applicazione</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <DiagRow label="Autenticazione" value={currentUser ? 'Autenticato' : 'Non autenticato'} ok={!!currentUser} />
            <DiagRow label="Ruolo" value={currentUser?.role || 'N/A'} ok={currentUser?.role === 'admin'} />
            <DiagRow label="Environment" value={import.meta.env.MODE} ok />
            <DiagRow label="Versione" value="1.0.0" ok />
            <DiagRow label="Stripe" value={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'Configurato' : 'Demo'} ok={!!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY} />
            <DiagRow label="Billing Mode" value={import.meta.env.VITE_BILLING_MODE || 'mock'} ok={import.meta.env.VITE_BILLING_MODE === 'live'} />
            <DiagRow label="PWA" value={'serviceWorker' in navigator ? 'Disponibile' : 'Non disponibile'} ok={'serviceWorker' in navigator} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Form Dialog */}
      <Dialog open={bankFormOpen} onOpenChange={setBankFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Modifica' : 'Aggiungi'} Coordinate Bancarie</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Intestatario *</Label><Input value={bankForm.holder} onChange={e => setBankForm(p => ({ ...p, holder: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Nome Banca</Label><Input value={bankForm.bankName} onChange={e => setBankForm(p => ({ ...p, bankName: e.target.value }))} /></div>
            <div className="space-y-1"><Label>IBAN *</Label><Input value={bankForm.iban} onChange={e => setBankForm(p => ({ ...p, iban: e.target.value }))} className="font-mono" /></div>
            <div className="space-y-1"><Label>BIC/SWIFT</Label><Input value={bankForm.bic} onChange={e => setBankForm(p => ({ ...p, bic: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Note</Label><Textarea value={bankForm.notes} onChange={e => setBankForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankFormOpen(false)}>Annulla</Button>
            <Button onClick={handleSaveBank} disabled={!bankForm.holder || !bankForm.iban}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PayPal Form Dialog */}
      <Dialog open={paypalFormOpen} onOpenChange={setPaypalFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{paypal ? 'Modifica' : 'Aggiungi'} Dati PayPal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Email PayPal *</Label><Input type="email" value={paypalForm.email} onChange={e => setPaypalForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Intestatario PayPal</Label><Input value={paypalForm.holder} onChange={e => setPaypalForm(p => ({ ...p, holder: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Note</Label><Textarea value={paypalForm.notes} onChange={e => setPaypalForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaypalFormOpen(false)}>Annulla</Button>
            <Button onClick={handleSavePaypal} disabled={!paypalForm.email}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiagRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{value}</span>
        <span className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-destructive/60'}`} />
      </div>
    </div>
  );
}
