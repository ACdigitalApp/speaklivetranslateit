import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Languages, ArrowLeft, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthStore, DEMO_MODE } from '@/store/useAuthStore';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Compila tutti i campi'); return; }
    setLoading(true);
    setError('');
    const ok = await login(email, password);
    setLoading(false);
    if (ok) {
      const user = useAuthStore.getState().currentUser;
      navigate(user?.role === 'admin' ? '/admin/users' : '/');
    } else {
      setError('Credenziali non valide');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error('Inserisci la tua email'); return; }
    // Demo mode: simulate password reset
    setResetSent(true);
    toast.success('Email di recupero inviata! Controlla la tua casella di posta.');
  };

  if (forgotMode) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-vox-page">
        <Card className="w-full max-w-md shadow-vox-soft border-border">
          <CardHeader className="items-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Mail size={32} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Recupera Password</h1>
            <p className="text-sm text-muted-foreground">Inserisci la tua email per ricevere il link di reset</p>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                  <Mail size={28} className="text-green-600" />
                </div>
                <p className="text-foreground font-medium">Email inviata!</p>
                <p className="text-sm text-muted-foreground">
                  Se l'indirizzo <strong>{resetEmail}</strong> è registrato, riceverai un link per reimpostare la password.
                </p>
                {DEMO_MODE && (
                  <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2">
                    🧪 <strong>Modalità Demo</strong>: nessuna email reale viene inviata.
                  </p>
                )}
                <Button variant="outline" className="w-full" onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(''); }}>
                  <ArrowLeft size={16} className="mr-2" /> Torna al Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" placeholder="nome@email.com" value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Invia link di recupero</Button>
                <Button variant="ghost" type="button" className="w-full" onClick={() => setForgotMode(false)}>
                  <ArrowLeft size={16} className="mr-2" /> Torna al Login
                </Button>
                {DEMO_MODE && (
                  <p className="text-xs text-center text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-2">
                    🧪 <strong>Modalità Demo</strong>: il recupero password è simulato.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-vox-page">
      <Card className="w-full max-w-md shadow-vox-soft border-border">
        <CardHeader className="items-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Languages size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bentornato!</h1>
          <p className="text-sm text-muted-foreground">Accedi a Speak & Translate Live</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nome@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">Non ricordi la password?</button>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Accesso...' : 'Accedi'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-6">
            Non hai un account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Registrati</Link>
          </p>
          {DEMO_MODE && (
            <p className="text-xs text-center text-muted-foreground mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2">
              🧪 <strong>Modalità Demo</strong>: usa le credenziali di test fornite dall'amministratore
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
