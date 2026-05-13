import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Globe, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

export default function Contatti() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-vox-page">
      <SEOHead
        title="Contatti — Speak & Translate Live"
        description="Contatta AC Digital App per Speak & Translate Live: email, sito web e informazioni di contatto."
        canonical="https://speaklivetranslate.it/contatti"
        ogUrl="https://speaklivetranslate.it/contatti"
      />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft size={16} className="mr-1" /> Indietro
        </Button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Contatti</h1>
          <p className="text-muted-foreground text-sm mt-1">AC Digital App — Speak & Translate Live</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Informazioni di contatto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Building2 size={18} className="text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">AC Digital App</p>
                <p className="text-muted-foreground">Brand operativo di Speak & Translate Live</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">Applicazione</p>
                <a href="https://speaklivetranslate.it" className="text-muted-foreground hover:underline">https://speaklivetranslate.it</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={18} className="text-primary shrink-0" />
              <div>
                <p className="font-medium text-foreground">Email</p>
                <a href="mailto:acdigital.app@gmail.com" className="text-muted-foreground hover:underline">acdigital.app@gmail.com</a>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Per supporto tecnico o domande sull’uso dell’app, scrivici all’indirizzo email indicato.
        </p>
      </div>
    </div>
  );
}
