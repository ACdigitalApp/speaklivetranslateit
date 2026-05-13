import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Mail, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <SEOHead
        title="Privacy Policy — Speak & Translate Live"
        description="Privacy Policy di Speak & Translate Live: come vengono gestiti i dati, i pagamenti tramite Stripe e i contatti con AC Digital App."
        canonical="https://speaklivetranslate.it/privacy"
        ogUrl="https://speaklivetranslate.it/privacy"
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Indietro
        </Button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm mt-1">Speak & Translate Live — AC Digital App</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Dati raccolti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Speak & Translate Live è un’app di <strong className="text-foreground">AC Digital App</strong> dedicata alla traduzione vocale, foto e PDF con funzionalità Premium.
            </p>
            <p>Possono essere raccolti i seguenti dati:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Indirizzo email associato all’account</li>
              <li>Dati tecnici di utilizzo necessari al funzionamento dell’app</li>
              <li>Informazioni necessarie per fornire il servizio di traduzione</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Pagamenti e abbonamenti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              I pagamenti e gli abbonamenti sono gestiti in modo sicuro tramite <strong className="text-foreground">Stripe</strong>, un provider di pagamenti certificato PCI DSS.
            </p>
            <p>
              <strong className="text-foreground">AC Digital App</strong> non conserva i dati completi delle carte di pagamento: questi vengono elaborati direttamente da Stripe in ambiente sicuro.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Supporto e contatti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              Per qualsiasi richiesta di supporto o informazioni sui dati personali, puoi scrivere a:
            </p>
            <div className="flex items-center gap-2 text-foreground">
              <Mail size={16} className="text-primary" />
              <a href="mailto:acdigital.app@gmail.com" className="hover:underline">acdigital.app@gmail.com</a>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Titolare del servizio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p><strong className="text-foreground">Brand operativo:</strong> AC Digital App</p>
            <p><strong className="text-foreground">Applicazione:</strong> Speak & Translate Live</p>
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-primary" />
              <a href="https://speaklivetranslate.it" className="text-foreground hover:underline">https://speaklivetranslate.it</a>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Ultimo aggiornamento: maggio 2026
        </p>
      </div>
    </div>
  );
}
