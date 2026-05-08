
create table if not exists public.app_visit_counters (
  app_key text primary key,
  visit_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.app_visit_counters enable row level security;

drop policy if exists "Public can read visit counters" on public.app_visit_counters;
create policy "Public can read visit counters"
  on public.app_visit_counters for select
  using (true);

create or replace function public.increment_app_visit(p_app_key text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count bigint;
begin
  insert into public.app_visit_counters (app_key, visit_count, updated_at)
  values (p_app_key, 1, now())
  on conflict (app_key) do update
    set visit_count = public.app_visit_counters.visit_count + 1,
        updated_at = now()
  returning visit_count into new_count;
  return new_count;
end;
$$;

create or replace function public.get_app_visit_count(p_app_key text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select visit_count from public.app_visit_counters where app_key = p_app_key), 0);
$$;

grant execute on function public.increment_app_visit(text) to anon, authenticated;
grant execute on function public.get_app_visit_count(text) to anon, authenticated;

insert into public.app_visit_counters (app_key, visit_count)
values ('speak_translate_live', 0)
on conflict (app_key) do update
  set visit_count = greatest(public.app_visit_counters.visit_count, 0);
