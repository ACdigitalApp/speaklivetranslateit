import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-email, x-admin-passcode, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

type Action = 'list' | 'update' | 'remove' | 'create';

type AdminUserPayload = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  whatsapp?: string | null;
  notifications?: boolean;
  role?: 'admin' | 'user_pro' | 'user';
  plan?: string;
  billingProvider?: string;
  subscriptionStatus?: string;
  subscriptionEnd?: string | null;
  totalPaid?: number;
  balance?: number;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const allowedPlans = new Set(['free', 'trial', 'premium', 'pro', 'monthly', 'yearly', 'premium_monthly', 'premium_yearly']);
const allowedStatuses = new Set(['active', 'inactive', 'trialing', 'in_trial', 'canceled', 'cancelled', 'expired']);
const allowedProviders = new Set(['mock', 'stripe', 'apple', 'googleplay']);
const allowedRoles = new Set(['admin', 'user_pro', 'user']);

const requireText = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} obbligatorio`);
  }
  return value.trim();
};

const requireUuid = (value: unknown) => {
  const id = requireText(value, 'ID utente');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new Error('ID utente non valido');
  }
  return id;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Backend non configurato correttamente');

    const authHeader = req.headers.get('Authorization') ?? '';

    // Service-role client (must NOT include user Authorization in global headers,
    // otherwise Supabase uses the user's JWT instead of the service role and RLS kicks in).
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let email = req.headers.get('x-admin-email')?.toLowerCase() ?? '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: authData } = await adminClient.auth.getUser(token);
        if (authData.user?.email) email = authData.user.email.toLowerCase();
      } catch { /* ignore: token may be anon publishable key */ }
    }

    const legacyPasscode = req.headers.get('x-admin-passcode') ?? '';
    if (!email || (email === 'acdigital.app@gmail.com' && legacyPasscode !== 'acdigital2026' && !authHeader.startsWith('Bearer '))) {
      return json({ error: 'Accesso non autorizzato' }, 401);
    }

    console.log('[admin-users] resolved email:', email);

    const { data: adminProfile, error: adminError } = await adminClient
      .from('profiles')
      .select('id, email, deleted_at')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    console.log('[admin-users] profile lookup:', { adminProfile, adminError });

    if (adminError) throw adminError;
    if (!adminProfile) return json({ error: 'Solo un amministratore può gestire gli utenti (profilo non trovato)' }, 403);

    const { data: roleRow, error: roleLookupError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', adminProfile.id)
      .eq('role', 'admin')
      .maybeSingle();

    console.log('[admin-users] role lookup:', { roleRow, roleLookupError });

    if (roleLookupError) throw roleLookupError;
    if (!roleRow) return json({ error: 'Solo un amministratore può gestire gli utenti' }, 403);

    const body = req.method === 'GET' ? { action: 'list' as Action } : await req.json().catch(() => ({}));
    const action = (body.action ?? 'list') as Action;

    const loadUsers = async () => {
      const { data, error } = await adminClient.rpc('get_all_users_for_admin');
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    };

    if (action === 'list') {
      return json({ users: await loadUsers() });
    }

    if (action === 'remove') {
      const id = requireUuid(body.id);
      if (id === adminProfile.id) return json({ error: 'Non puoi eliminare il tuo account amministratore' }, 400);
      const { error } = await adminClient.from('profiles').update({ deleted_at: new Date().toISOString() }).eq('id', id).is('deleted_at', null);
      if (error) throw error;
      return json({ users: await loadUsers(), message: 'Utente eliminato correttamente' });
    }

    if (action === 'create') {
      const payload = (body.user ?? {}) as AdminUserPayload;
      const role = payload.role ?? 'user';
      const plan = payload.plan ?? 'free';
      const status = payload.subscriptionStatus ?? 'inactive';
      const provider = payload.billingProvider ?? 'mock';
      if (!allowedRoles.has(role)) throw new Error('Ruolo non valido');
      if (!allowedPlans.has(plan)) throw new Error('Piano non valido');
      if (!allowedStatuses.has(status)) throw new Error('Stato abbonamento non valido');
      if (!allowedProviders.has(provider)) throw new Error('Provider non valido');

      const { data: profile, error } = await adminClient
        .from('profiles')
        .insert({
          name: requireText(payload.name, 'Nome'),
          email: requireText(payload.email, 'Email').toLowerCase(),
          phone: payload.phone || null,
          whatsapp: payload.whatsapp || null,
          notifications: payload.notifications ?? true,
          plan,
          subscription_status: status,
          subscription_end: payload.subscriptionEnd || null,
          total_paid: payload.totalPaid ?? 0,
          balance: payload.balance ?? 0,
          billing_provider: provider,
        })
        .select('id')
        .single();
      if (error) throw error;
      const { error: roleError } = await adminClient.from('user_roles').insert({ user_id: profile.id, role });
      if (roleError) throw roleError;
      return json({ users: await loadUsers(), message: 'Utente creato correttamente' });
    }

    if (action === 'update') {
      const payload = (body.user ?? {}) as AdminUserPayload;
      const id = requireUuid(payload.id);
      const role = payload.role ?? 'user';
      const plan = payload.plan ?? 'free';
      const status = payload.subscriptionStatus ?? 'inactive';
      const provider = payload.billingProvider ?? 'mock';
      if (!allowedRoles.has(role)) throw new Error('Ruolo non valido');
      if (!allowedPlans.has(plan)) throw new Error('Piano non valido');
      if (!allowedStatuses.has(status)) throw new Error('Stato abbonamento non valido');
      if (!allowedProviders.has(provider)) throw new Error('Provider non valido');

      const { error } = await adminClient
        .from('profiles')
        .update({
          name: requireText(payload.name, 'Nome'),
          email: requireText(payload.email, 'Email').toLowerCase(),
          phone: payload.phone || null,
          whatsapp: payload.whatsapp || null,
          notifications: payload.notifications ?? true,
          plan,
          billing_provider: provider,
          subscription_status: status,
          subscription_end: payload.subscriptionEnd || null,
          total_paid: payload.totalPaid ?? 0,
          balance: payload.balance ?? 0,
        })
        .eq('id', id)
        .is('deleted_at', null);
      if (error) throw error;

      const { error: deleteRolesError } = await adminClient.from('user_roles').delete().eq('user_id', id);
      if (deleteRolesError) throw deleteRolesError;
      const { error: roleError } = await adminClient.from('user_roles').insert({ user_id: id, role });
      if (roleError) throw roleError;

      return json({ users: await loadUsers(), message: 'Utente aggiornato correttamente' });
    }

    return json({ error: 'Azione non supportata' }, 400);
  } catch (error) {
    console.error('admin-users error', error);
    const message = error instanceof Error ? error.message : 'Errore backend sconosciuto';
    return json({ error: message }, 500);
  }
});
