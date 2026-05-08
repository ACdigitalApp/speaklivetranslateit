import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const APP_KEY = 'speak_translate_live';
const THROTTLE_PREFIX = 'speak_translate_live_visit_counted_at_';
const THROTTLE_MS = 24 * 60 * 60 * 1000;

export function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return;

    let lastTs = 0;
    const key = THROTTLE_PREFIX + path;
    try {
      lastTs = parseInt(localStorage.getItem(key) || '0', 10) || 0;
    } catch {
      /* noop */
    }
    if (Date.now() - lastTs < THROTTLE_MS) return;

    // Optimistically mark to prevent duplicate calls in StrictMode/double mount
    try {
      localStorage.setItem(key, String(Date.now()));
    } catch {
      /* noop */
    }

    supabase.rpc('increment_app_visit', { p_app_key: APP_KEY }).then(({ error }) => {
      if (error) {
        // Roll back the throttle marker so a future visit can retry
        try {
          if (lastTs > 0) localStorage.setItem(key, String(lastTs));
          else localStorage.removeItem(key);
        } catch {
          /* noop */
        }
        console.warn('[VisitTracker] increment failed:', error.message);
      }
    });
  }, [location.pathname]);

  return null;
}
