import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

const STORAGE_KEY = 'speak_translate_live_visit_count';

export function getVisitCount(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function VisitsTotalCard() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    setCount(getVisitCount());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCount(getVisitCount());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Pad to 5 digits like the mockup
  const digits = String(count).padStart(5, '0').split('');

  return (
    <Card className="mb-4">
      <CardContent className="py-4 px-5 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-foreground">Visite Totali</h3>
        <div className="flex items-center gap-1.5">
          {digits.map((d, i) => (
            <div
              key={i}
              className="min-w-[34px] h-9 px-2 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono font-semibold text-base"
            >
              {d}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
