-- Tappa 0: prepara DB per futura migrazione ad Auth reale.
-- Idempotente. Non spegne DEMO_MODE. Non tocca dati esistenti.

-- 1) Funzione trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_admin_email constant text := 'acdigital.app@gmail.com';
  v_email text := lower(coalesce(new.email, ''));
  v_name text := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
begin
  if v_email = '' then
    return new;
  end if;

  -- Riusa profilo esistente (es. seed admin) collegandolo all'auth user.
  update public.profiles
     set user_id = new.id,
         name = case when name is null or name = '' then v_name else name end,
         updated_at = now()
   where lower(email) = v_email
     and (user_id is null or user_id = new.id)
     and deleted_at is null
   returning id into v_profile_id;

  -- Se non esisteva, crealo.
  if v_profile_id is null then
    insert into public.profiles (user_id, email, name)
    values (new.id, v_email, v_name)
    returning id into v_profile_id;
  end if;

  -- Promozione admin automatica per email ufficiale.
  if v_email = v_admin_email and v_profile_id is not null then
    insert into public.user_roles (user_id, role)
    values (v_profile_id, 'admin'::public.app_role)
    on conflict do nothing;
  end if;

  return new;
exception when others then
  -- Mai bloccare il signup per errori del trigger.
  raise warning 'handle_new_user failed: %', sqlerrm;
  return new;
end;
$$;

-- 2) Trigger su auth.users (ricreato in modo idempotente)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();