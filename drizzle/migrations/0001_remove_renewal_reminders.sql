DO $$ BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE command ILIKE '%sumup-renewal-reminders%';
EXCEPTION WHEN others THEN NULL; END $$;
COMMENT ON TABLE public.cron_tokens IS 'DEPRECATED: renewal reminders removed';