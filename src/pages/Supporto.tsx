import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail, LogIn, CreditCard, Mic, Camera, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

const sections = [
  {
    icon: LogIn,
    title: 'Problemi di accesso / login',
    text: 'Se non riesci ad accedere, verifica di usare l’email corretta e controlla la cartella spam per il link di conferma. Se il problema persiste, contattaci.',
  },
  {
    icon: CreditCard,
    title: 'Problemi con abbonamento Premium',
    text: 'Se dopo l’acquisto non vedi attivato il piano Premium, prova a uscire e riaccedere. Se usi l’app mobile, usa la funzione "Ripristina acquisti".',
  },
  {
    icon: CreditCard,
    title: 'Problemi con pagamento o rinnovo',
    text: 'I pagamenti sono gestiti da Stripe. Per problemi legati alla carta o al rinnovo, controlla che i dati di pagamento siano aggiornati.',
  },
  {
    icon: Mic,
    title: 'Problemi con traduzione vocale, foto o PDF',
    text: 'Assicurati che il browser abbia i permessi per microfono e camera. Per i PDF, verifica che il file non sia protetto da password e che contenga testo selezionabile.',
  },
];

export default function Supporto() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <SEOHead
        title="Supporto — Speak & Translate Live"
        description="Pagina di supporto per utenti Speak & Translate Live: accesso, abbonamento Premium, pagamenti e assistenza traduzioni."
        canonical="https://speaklivetranslate.it/supporto"
        ogUrl="https://speaklivetranslate.it/supporto"
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Indietro
        </Button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Supporto</h1>
          <p className="text-muted-foreground text-sm mt-1">Come possiamo aiutarti?</p>
        </div>

        <div className="space-y-4 mb-8">
          {sections.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <s.icon size={18} className="text-primary" />
                  {s.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail size={18} className="text-primary" />
              Richiesta assistenza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Se non trovi la risposta che cerchi, scrivi a <strong className="text-foreground">AC Digital App</strong>:
            </p>
            <div className="flex items-center gap-2 text-foreground">
              <Mail size={16} className="text-primary" />
              <a href="mailto:acdigital.app@gmail.com" className="hover:underline">acdigital.app@gmail.com</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
