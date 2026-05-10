import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Languages } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/store/useAuthStore';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore(s => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Compila i campi obbligatori'); return; }
    if (password.length < 6) { setError('La password deve avere almeno 6 caratteri'); return; }
    if (password !== confirmPw) { setError('Le password non coincidono'); return; }
    if (!termsAccepted) { setError('Devi accettare i Termini e la Privacy Policy per continuare'); return; }
    setLoading(true);
    setError('');
    const ok = await register({ name, email, password, whatsapp: whatsapp || undefined });
    setLoading(false);
    if (ok) navigate('/');
    else setError('Registrazione fallita');
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-8 bg-vox-page">
      <Card className="w-full max-w-md shadow-vox-soft border-border">
        <CardHeader className="items-center pb-2">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <Languages size={32} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Crea Account</h1>
          <p className="text-sm text-muted-foreground">Registrati a Speak & Translate Live</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" placeholder="Il tuo nome" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email *</Label>
              <Input id="reg-email" type="email" placeholder="nome@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp <span className="text-muted-foreground font-normal">(opzionale)</span></Label>
              <Input id="whatsapp" placeholder="+39 333 1234567" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-pw">Password *</Label>
              <div className="relative">
                <Input id="reg-pw" type={showPw ? 'text' : 'password'} placeholder="Minimo 6 caratteri" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pw">Conferma Password *</Label>
              <Input id="confirm-pw" type={showPw ? 'text' : 'password'} placeholder="Ripeti la password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
            </div>
            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(!!v)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Ho letto e accetto i{' '}
                <a href="/termini" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Termini e Condizioni
                </a>{' '}
                e la{' '}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                . Acconsento al trattamento dei miei dati personali ai sensi del GDPR.
              </label>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrazione...' : 'Registrati'}
            </Button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-6">
            Hai già un account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Accedi</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
