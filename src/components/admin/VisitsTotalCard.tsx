import { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const APP_KEY = 'speak_translate_live';

export type VisitsTotalCardHandle = { refresh: () => void };

export const VisitsTotalCard = forwardRef<VisitsTotalCardHandle>((_, ref) => {
  const [count, setCount] = useState<number>(0);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_app_visit_count', { p_app_key: APP_KEY });
    if (!error && typeof data === 'number') setCount(data);
    else if (!error && data != null) setCount(Number(data) || 0);
  }, []);

  useEffect(() => { load(); }, [load]);

  useImperativeHandle(ref, () => ({ refresh: load }), [load]);

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
});

VisitsTotalCard.displayName = 'VisitsTotalCard';
