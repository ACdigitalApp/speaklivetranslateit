import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';
import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2.78.0/cors';

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
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Accesso non autorizzato' }, 401);

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await adminClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !authData.user) return json({ error: 'Sessione non valida' }, 401);

    const email = authData.user.email?.toLowerCase() ?? '';
    const { data: adminProfile, error: adminError } = await adminClient
      .from('profiles')
      .select('id, email, deleted_at, user_roles!inner(role)')
      .or(`user_id.eq.${authData.user.id},email.eq.${email}`)
      .is('deleted_at', null)
      .eq('user_roles.role', 'admin')
      .maybeSingle();

    if (adminError) throw adminError;
    if (!adminProfile) return json({ error: 'Solo un amministratore può gestire gli utenti' }, 403);

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
