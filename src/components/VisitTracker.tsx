import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_KEY = 'speak_translate_live_visit_count';
const THROTTLE_PREFIX = 'speak_translate_live_visit_counted_at_';
const THROTTLE_MS = 24 * 60 * 60 * 1000;

export function VisitTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return;
    try {
      const key = THROTTLE_PREFIX + path;
      const last = parseInt(localStorage.getItem(key) || '0', 10) || 0;
      if (Date.now() - last < THROTTLE_MS) return;
      const current = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
      localStorage.setItem(STORAGE_KEY, String(current + 1));
      localStorage.setItem(key, String(Date.now()));
    } catch {
      /* noop */
    }
  }, [location.pathname]);

  return null;
}
