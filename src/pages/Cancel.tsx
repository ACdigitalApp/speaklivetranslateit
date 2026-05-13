import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Cancel() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-vox-page flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12 space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <XCircle size={32} className="text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">Checkout annullato</h1>
          <p className="text-sm text-muted-foreground">
            Nessun addebito è stato effettuato. Puoi riprovare quando vuoi.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/pricing')}>Torna ai piani</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Torna alla Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
