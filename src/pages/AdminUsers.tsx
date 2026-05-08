import { useState, useCallback, useMemo, useEffect } from 'react';
import { Plus, RefreshCw, Key, Trash2, Search, DollarSign, TrendingUp, Users as UsersIcon, CreditCard, Globe, Smartphone, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { RoleBadge } from '@/components/auth/RoleBadge';
import { PlanBadge, StatusBadge } from '@/components/subscription/PlanBadge';
import { useAuthStore, getMockUsers } from '@/store/useAuthStore';
import { getProviderLabel } from '@/config/subscriptions';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, UserRole } from '@/types/auth';
import type { BillingProvider } from '@/types/billing';

const PROVIDER_COLORS: Record<BillingProvider, string> = {
  mock: 'bg-muted text-muted-foreground',
  stripe: 'bg-primary/10 text-primary',
  apple: 'bg-muted text-foreground',
  googleplay: 'bg-muted text-foreground',
};

function ProviderBadge({ provider }: { provider: BillingProvider }) {
  return (
    <Badge variant="outline" className={`text-xs ${PROVIDER_COLORS[provider]}`}>
      {provider === 'stripe' && <Globe size={10} className="mr-1" />}
      {(provider === 'apple' || provider === 'googleplay') && <Smartphone size={10} className="mr-1" />}
      {getProviderLabel(provider)}
    </Badge>
  );
}

// URL API altre app ACdigitalApp
const CROSS_APP_APIS = {
  gestionepassword: 'https://gestione-password-backend.up.railway.app/api/admin/revenue',
  librifree: 'https://librifree-backend.up.railway.app/api/admin/revenue',
  gestionescadenze: 'https://gestionescadenze-backend.up.railway.app/api/admin/revenue',
};

type AppRevenue = { amount: number; users: number; loading: boolean };

export default function AdminUsers() {
  const currentUser = useAuthStore(s => s.currentUser);
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>(getMockUsers());
  const [refreshing, setRefreshing] = useState(false);
  const [crossApp, setCrossApp] = useState<Record<string, AppRevenue>>({
    gestionepassword: { amount: 0, users: 0, loading: true },
    librifree: { amount: 0, users: 0, loading: true },
    gestionescadenze: { amount: 0, users: 0, loading: true },
  });
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [pwFormOpen, setPwFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [pwFields, setPwFields] = useState({ next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'user' as UserRole, whatsapp: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Carica incassi altre app all'avvio
  const fetchCrossAppRevenue = useCallback(async () => {
    const apps = Object.keys(CROSS_APP_APIS) as (keyof typeof CROSS_APP_APIS)[];
    for (const app of apps) {
      try {
        const res = await fetch(CROSS_APP_APIS[app], { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          setCrossApp(prev => ({ ...prev, [app]: { amount: data.total_revenue || 0, users: data.total_users || 0, loading: false } }));
        } else throw new Error('non-ok');
      } catch {
        setCrossApp(prev => ({ ...prev, [app]: { amount: 0, users: 0, loading: false } }));
      }
    }
  }, []);

  useEffect(() => { fetchCrossAppRevenue(); }, [fetchCrossAppRevenue]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCrossAppRevenue();
    setTimeout(() => {
      setUsers(getMockUsers());
      setRefreshing(false);
      toast({ title: '✅ Lista aggiornata', description: `${getMockUsers().length} utenti caricati` });
    }, 600);
  }, [toast, fetchCrossAppRevenue]);

  const revenue = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    let totalRevenue = 0, totalBalance = 0, payingUsers = 0, revenueLast30 = 0, trials = 0, expired = 0;
    users.forEach(u => {
      totalRevenue += u.totalPaid;
      totalBalance += u.balance;
      if (u.totalPaid > 0) payingUsers++;
      if (u.subscriptionStatus === 'in_trial') trials++;
      if (u.subscriptionStatus === 'expired') expired++;
      u.transactions.forEach(t => {
        if (t.status === 'completed' && new Date(t.date) >= thirtyDaysAgo) revenueLast30 += t.amount;
      });
    });
    return { totalRevenue, totalBalance, payingUsers, revenueLast30, trials, expired };
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      if (filterPlan !== 'all' && u.plan !== filterPlan) return false;
      if (filterStatus !== 'all' && u.subscriptionStatus !== filterStatus) return false;
      return true;
    });
  }, [users, searchQuery, filterPlan, filterStatus]);

  const openNew = () => {
    setIsNew(true);
    setForm({ name: '', email: '', role: 'user', whatsapp: '' });
    setUserFormOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setIsNew(false);
    setSelectedUser(u);
    setForm({ name: u.name, email: u.email, role: u.role, whatsapp: u.whatsapp || '' });
    setUserFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.email) return;
    if (isNew) {
      const newUser: AppUser = {
        id: Date.now().toString(),
        name: form.name,
        email: form.email,
        role: form.role,
        whatsapp: form.whatsapp || undefined,
        notifications: true,
        registeredAt: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
        plan: 'free',
        subscriptionStatus: 'expired',
        totalPaid: 0,
        balance: 0,
        transactions: [],
        billingProvider: 'mock',
      };
      setUsers(prev => [...prev, newUser]);
    } else if (selectedUser) {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, name: form.name, email: form.email, role: form.role, whatsapp: form.whatsapp || undefined } : u));
    }
    setUserFormOpen(false);
  };

  const handleDelete = () => {
    if (selectedUser) setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
    setDeleteConfirmOpen(false);
    setSelectedUser(null);
  };

  const toggleNotifications = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, notifications: !u.notifications } : u));
  };

  const fmtDate = (d?: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return d; }
  };

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <div className="max-w-full mx-auto px-4 py-6">
        <PageHeader
          title="Gestione Utenti"
          subtitle="Pannello amministrativo — utenti, piani e incassi"
          backTo="/"
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => window.location.assign('/admin')}>Impostazioni Admin</Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}><RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Aggiornando...' : 'Aggiorna'}</Button>
              <Button size="sm" onClick={openNew}><Plus size={14} className="mr-1" /> Nuovo Utente</Button>
            </>
          }
        />

        {/* Revenue summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <SummaryCard label="Incasso Totale" value={`€${revenue.totalRevenue.toFixed(2)}`} icon={<TrendingUp size={16} className="text-primary" />} highlight />
          <SummaryCard label="Saldo Totale" value={`€${revenue.totalBalance.toFixed(2)}`} icon={<DollarSign size={16} className="text-primary" />} highlight />
          <SummaryCard label="Utenti Paganti" value={revenue.payingUsers.toString()} icon={<UsersIcon size={16} />} />
          <SummaryCard label="Ultimi 30gg" value={`€${revenue.revenueLast30.toFixed(2)}`} icon={<CreditCard size={16} />} />
          <SummaryCard label="Trial Attive" value={revenue.trials.toString()} icon={<UsersIcon size={16} />} />
          <SummaryCard label="Scaduti" value={revenue.expired.toString()} icon={<UsersIcon size={16} />} />
        </div>

        {/* Cross-app Revenue Dashboard */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" />
              Incassi Totali — Tutte le App ACdigitalApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <AppRevenueCard name="SpeakEasy Translator" domain="speaklivetranslate.it" amount={revenue.totalRevenue} users={users.length} color="green" loading={false} />
              <AppRevenueCard name="Gestione Password" domain="gestionepassword.it" amount={crossApp.gestionepassword.amount} users={crossApp.gestionepassword.users} color="blue" loading={crossApp.gestionepassword.loading} />
              <AppRevenueCard name="Librifree" domain="librifree.it" amount={crossApp.librifree.amount} users={crossApp.librifree.users} color="orange" loading={crossApp.librifree.loading} />
              <AppRevenueCard name="Gestione Scadenze" domain="gestionescadenze.app" amount={crossApp.gestionescadenze.amount} users={crossApp.gestionescadenze.users} color="purple" loading={crossApp.gestionescadenze.loading} />
            </div>
            <div className="flex items-center justify-between bg-primary text-primary-foreground rounded-lg px-4 py-3">
              <span className="font-bold text-sm">💰 TOTALE GENERALE ACdigitalApp</span>
              <span className="font-bold text-lg font-mono">€{(revenue.totalRevenue + crossApp.gestionepassword.amount + crossApp.librifree.amount + crossApp.gestionescadenze.amount).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cerca nome o email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Select value={filterPlan} onValueChange={setFilterPlan}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Piano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i piani</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="premium_monthly">Monthly</SelectItem>
              <SelectItem value="premium_yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Stato" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="active">Attivo</SelectItem>
              <SelectItem value="in_trial">In Trial</SelectItem>
              <SelectItem value="expired">Scaduto</SelectItem>
              <SelectItem value="cancelled">Annullato</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Piano</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Stato Abb.</TableHead>
                    <TableHead>Scadenza</TableHead>
                    <TableHead>Tot. Pagato</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Notifiche</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Data Reg.</TableHead>
                    <TableHead>Ultimo Accesso</TableHead>
                    <TableHead className="text-right sticky right-0 bg-background z-10">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium text-sm">
                        <span className="flex items-center gap-2">
                          {u.name}
                          {u.id === currentUser?.id && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Tu</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell><PlanBadge plan={u.plan} /></TableCell>
                      <TableCell><ProviderBadge provider={(u.billingProvider as BillingProvider) || 'mock'} /></TableCell>
                      <TableCell><StatusBadge status={u.subscriptionStatus} /></TableCell>
                      <TableCell className="text-xs">{fmtDate(u.subscriptionEnd)}</TableCell>
                      <TableCell className="text-xs font-mono">€{u.totalPaid.toFixed(2)}</TableCell>
                      <TableCell className="text-xs font-mono">€{u.balance.toFixed(2)}</TableCell>
                      <TableCell>
                        <Switch checked={u.notifications} onCheckedChange={() => toggleNotifications(u.id)} />
                      </TableCell>
                      <TableCell className="text-xs">
                        {u.whatsapp ? <span className="flex items-center gap-1">📞 {u.whatsapp}</span> : '—'}
                      </TableCell>
                      <TableCell className="text-xs">{fmtDate(u.registeredAt)}</TableCell>
                      <TableCell className="text-xs">{fmtDate(u.lastAccess)}</TableCell>
                      <TableCell className="text-right sticky right-0 bg-background z-10">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => openEdit(u)} className="text-xs h-7 px-2">Modifica</Button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(u); setPaymentDetailOpen(true); }} className="text-xs h-7 px-2">€</Button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(u); setPwFields({ next: '', confirm: '' }); setPwError(''); setPwFormOpen(true); }} className="text-xs h-7 px-2"><Key size={12} className="mr-1" />PW</Button>
                          <Button variant="outline" size="sm" onClick={() => { setSelectedUser(u); setDeleteConfirmOpen(true); }} disabled={u.id === currentUser?.id || u.role === 'admin'} className="text-xs h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 size={12} className="mr-1" />Del</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Form */}
      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isNew ? 'Nuovo' : 'Modifica'} Utente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-1">
              <Label>Ruolo</Label>
              <Select value={form.role} onValueChange={(v) => setForm(p => ({ ...p, role: v as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user_pro">User Pro</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserFormOpen(false)}>Annulla</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.email}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={pwFormOpen} onOpenChange={(open) => { setPwFormOpen(open); if (!open) { setPwFields({ next: '', confirm: '' }); setPwError(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambio Password</DialogTitle>
            <DialogDescription>Imposta una nuova password per <strong>{selectedUser?.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nuova password</Label>
              <Input type="password" value={pwFields.next} onChange={e => setPwFields(p => ({ ...p, next: e.target.value }))} placeholder="Minimo 8 caratteri" />
            </div>
            <div className="space-y-1">
              <Label>Conferma password</Label>
              <Input type="password" value={pwFields.confirm} onChange={e => setPwFields(p => ({ ...p, confirm: e.target.value }))} placeholder="Ripeti la password" />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwFormOpen(false); setPwFields({ next: '', confirm: '' }); setPwError(''); }}>Annulla</Button>
            <Button onClick={() => {
              if (pwFields.next.length < 8) { setPwError('Minimo 8 caratteri'); return; }
              if (pwFields.next !== pwFields.confirm) { setPwError('Le password non coincidono'); return; }
              setPwFormOpen(false);
              setPwFields({ next: '', confirm: '' });
              setPwError('');
            }}>Salva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Detail Dialog */}
      <Dialog open={paymentDetailOpen} onOpenChange={setPaymentDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettaglio Pagamenti — {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Piano</p>
                  <PlanBadge plan={selectedUser.plan} />
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Provider</p>
                  <ProviderBadge provider={(selectedUser.billingProvider as BillingProvider) || 'mock'} />
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Stato</p>
                  <StatusBadge status={selectedUser.subscriptionStatus} />
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Scadenza</p>
                  <p className="font-semibold text-sm">{fmtDate(selectedUser.subscriptionEnd)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Totale Pagato</p>
                  <p className="font-semibold text-sm font-mono">€{selectedUser.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className="font-semibold text-sm font-mono">€{selectedUser.balance.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Storico Transazioni</h4>
                {selectedUser.transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nessuna transazione</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Data</TableHead><TableHead>Descrizione</TableHead><TableHead>Importo</TableHead><TableHead>Stato</TableHead><TableHead>Rif.</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>{selectedUser.transactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{fmtDate(t.date)}</TableCell>
                        <TableCell className="text-xs">{t.description}</TableCell>
                        <TableCell className="text-xs font-mono">€{t.amount.toFixed(2)}</TableCell>
                        <TableCell><Badge variant="outline" className={`text-xs ${t.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>{t.status === 'completed' ? 'Riuscito' : t.status}</Badge></TableCell>
                        <TableCell className="text-xs font-mono">{t.reference}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare utente?</AlertDialogTitle>
            <AlertDialogDescription>
              Stai per eliminare l'utente <strong>{selectedUser?.name}</strong>. Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ label, value, icon, highlight }: { label: string; value: string; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary/30' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className={`text-lg font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function AppRevenueCard({ name, domain, amount, users, color, loading }: { name: string; domain: string; amount: number; users: number; color: string; loading: boolean }) {
  const colorMap: Record<string, string> = {
    green: 'border-green-200 bg-green-50',
    blue: 'border-blue-200 bg-blue-50',
    orange: 'border-orange-200 bg-orange-50',
    purple: 'border-purple-200 bg-purple-50',
  };
  const textMap: Record<string, string> = {
    green: 'text-green-700',
    blue: 'text-blue-700',
    orange: 'text-orange-700',
    purple: 'text-purple-700',
  };
  return (
    <div className={`rounded-lg border p-3 ${colorMap[color]}`}>
      <p className={`font-semibold text-sm ${textMap[color]}`}>{name}</p>
      <p className="text-xs text-muted-foreground mb-2">{domain}</p>
      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <div className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${textMap[color].replace('text-', 'border-')}`} />
          <span className="text-xs text-muted-foreground">Caricamento...</span>
        </div>
      ) : (
        <>
          <p className={`text-xl font-bold font-mono ${textMap[color]}`}>€{amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{users} utenti</p>
        </>
      )}
    </div>
  );
}
