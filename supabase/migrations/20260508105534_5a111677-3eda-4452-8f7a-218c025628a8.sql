create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'user_pro', 'user');
create type public.admin_plan_type as enum ('free', 'trial', 'premium', 'pro', 'monthly', 'yearly', 'premium_monthly', 'premium_yearly');
create type public.admin_subscription_status as enum ('active', 'inactive', 'trialing', 'in_trial', 'canceled', 'cancelled', 'expired');
create type public.admin_billing_provider as enum ('mock', 'stripe', 'apple', 'googleplay');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  name text not null default '',
  email text not null unique,
  phone text,
  whatsapp text,
  notifications boolean not null default true,
  avatar_url text,
  registered_at timestamptz not null default now(),
  last_access timestamptz not null default now(),
  plan public.admin_plan_type not null default 'free',
  subscription_status public.admin_subscription_status not null default 'inactive',
  trial_start timestamptz,
  trial_end timestamptz,
  subscription_start timestamptz,
  subscription_end timestamptz,
  next_billing_date timestamptz,
  total_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  billing_provider public.admin_billing_provider not null default 'mock',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table public.user_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  transaction_date timestamptz not null default now(),
  description text not null default '',
  amount numeric(12,2) not null default 0,
  status text not null default 'completed',
  reference text not null default '',
  plan_type public.admin_plan_type not null default 'free',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_payment_transactions enable row level security;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where p.user_id = _user_id
      and ur.role = _role
      and p.deleted_at is null
  )
$$;

create or replace function public.current_admin_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  join public.user_roles ur on ur.user_id = p.id and ur.role = 'admin'
  where p.deleted_at is null
    and (
      (auth.uid() is not null and p.user_id = auth.uid())
      or lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  limit 1
$$;

create policy "Admins can view profiles"
on public.profiles
for select
to authenticated
using (public.current_admin_profile_id() is not null);

create policy "Admins can view user roles"
on public.user_roles
for select
to authenticated
using (public.current_admin_profile_id() is not null);

create policy "Admins can view payment transactions"
on public.user_payment_transactions
for select
to authenticated
using (public.current_admin_profile_id() is not null);

create or replace function public.get_all_users_for_admin()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.current_admin_profile_id() is null then
    raise exception 'Only administrators can load users';
  end if;

  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'authUserId', p.user_id,
        'name', p.name,
        'email', p.email,
        'role', coalesce((select ur.role::text from public.user_roles ur where ur.user_id = p.id order by case ur.role when 'admin' then 1 when 'user_pro' then 2 else 3 end limit 1), 'user'),
        'phone', p.phone,
        'whatsapp', p.whatsapp,
        'notifications', p.notifications,
        'avatarUrl', p.avatar_url,
        'registeredAt', p.registered_at,
        'lastAccess', p.last_access,
        'plan', p.plan::text,
        'subscriptionStatus', p.subscription_status::text,
        'trialStart', p.trial_start,
        'trialEnd', p.trial_end,
        'subscriptionStart', p.subscription_start,
        'subscriptionEnd', p.subscription_end,
        'nextBillingDate', p.next_billing_date,
        'totalPaid', p.total_paid,
        'balance', p.balance,
        'billingProvider', p.billing_provider::text,
        'transactions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', t.id,
            'date', t.transaction_date,
            'description', t.description,
            'amount', t.amount,
            'status', t.status,
            'reference', t.reference,
            'planType', t.plan_type::text
          ) order by t.transaction_date desc)
          from public.user_payment_transactions t
          where t.user_id = p.id
        ), '[]'::jsonb)
      )
      order by p.registered_at desc
    )
    from public.profiles p
    where p.deleted_at is null
  ), '[]'::jsonb);
end;
$$;

create or replace function public.admin_update_profile(
  p_user_id uuid,
  p_name text,
  p_email text,
  p_phone text,
  p_whatsapp text,
  p_notifications boolean,
  p_plan text,
  p_billing_provider text,
  p_subscription_status text,
  p_subscription_end timestamptz,
  p_total_paid numeric,
  p_balance numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if public.current_admin_profile_id() is null then
    raise exception 'Only administrators can update users';
  end if;

  update public.profiles
  set name = coalesce(nullif(trim(p_name), ''), name),
      email = lower(trim(p_email)),
      phone = nullif(trim(coalesce(p_phone, '')), ''),
      whatsapp = nullif(trim(coalesce(p_whatsapp, '')), ''),
      notifications = coalesce(p_notifications, notifications),
      plan = p_plan::public.admin_plan_type,
      billing_provider = p_billing_provider::public.admin_billing_provider,
      subscription_status = p_subscription_status::public.admin_subscription_status,
      subscription_end = p_subscription_end,
      total_paid = coalesce(p_total_paid, total_paid),
      balance = coalesce(p_balance, balance)
  where id = p_user_id
    and deleted_at is null
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'User not found';
  end if;

  return public.get_all_users_for_admin();
end;
$$;

create or replace function public.update_user_role(p_user_id uuid, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_admin_profile_id() is null then
    raise exception 'Only administrators can update roles';
  end if;

  delete from public.user_roles where user_id = p_user_id;
  insert into public.user_roles (user_id, role) values (p_user_id, p_role::public.app_role);

  return public.get_all_users_for_admin();
end;
$$;

create or replace function public.remove_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  admin_id := public.current_admin_profile_id();
  if admin_id is null then
    raise exception 'Only administrators can remove users';
  end if;

  if admin_id = p_user_id then
    raise exception 'You cannot remove your own administrator account';
  end if;

  update public.profiles
  set deleted_at = now()
  where id = p_user_id
    and deleted_at is null;

  if not found then
    raise exception 'User not found';
  end if;

  return public.get_all_users_for_admin();
end;
$$;

create or replace function public.delete_user(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.remove_user(p_user_id);
end;
$$;

insert into public.profiles (name, email, whatsapp, notifications, registered_at, last_access, plan, subscription_status, subscription_end, total_paid, balance, billing_provider)
values ('Antonio Caridi', 'acdigital.app@gmail.com', '+39 333 1234567', true, '2024-01-15T10:00:00Z', now(), 'trial', 'trialing', now() + interval '5 days', 0, 0, 'mock')
on conflict (email) do update
set name = excluded.name,
    whatsapp = excluded.whatsapp,
    notifications = excluded.notifications,
    plan = excluded.plan,
    subscription_status = excluded.subscription_status,
    subscription_end = excluded.subscription_end,
    deleted_at = null;

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from public.profiles
where lower(email) = 'acdigital.app@gmail.com'
on conflict (user_id, role) do nothing;