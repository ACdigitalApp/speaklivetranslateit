
create table if not exists public.admin_notification_log (
  id uuid primary key default gen_random_uuid(),
  app_key text not null,
  event_type text not null,
  idempotency_key text not null,
  recipient text not null,
  status text not null default 'sent',
  error text,
  payload jsonb,
  created_at timestamptz not null default now(),
  unique (app_key, event_type, idempotency_key)
);

alter table public.admin_notification_log enable row level security;

create policy "Admins can view notification log"
on public.admin_notification_log for select
to authenticated
using (current_admin_profile_id() is not null);

create index if not exists idx_admin_notif_log_created on public.admin_notification_log (created_at desc);
