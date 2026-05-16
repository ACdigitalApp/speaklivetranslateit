import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppUser, UserRole } from '@/types/auth';
import { setAdminCredentials, clearAdminCredentials } from '@/services/adminUsersApi';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export const DEMO_MODE = true; // Always enabled until real auth backend is connected

type AuthState = {
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  guestMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string; whatsapp?: string }) => Promise<boolean>;
  logout: () => void;
  setGuestMode: (v: boolean) => void;
  updateUser: (data: Partial<AppUser>) => void;
};

const MOCK_ADMIN: AppUser = {
  id: '1',
  name: 'Antonio Caridi',
  email: 'acdigital.app@gmail.com',
  role: 'admin',
  whatsapp: '+39 333 1234567',
  notifications: true,
  registeredAt: '2024-01-15T10:00:00Z',
  lastAccess: new Date().toISOString(),
  plan: 'trial',
  subscriptionStatus: 'in_trial',
  trialStart: new Date(Date.now() - 2 * 86400000).toISOString(),
  trialEnd: new Date(Date.now() + 5 * 86400000).toISOString(),
  subscriptionStart: new Date(Date.now() - 2 * 86400000).toISOString(),
  subscriptionEnd: new Date(Date.now() + 5 * 86400000).toISOString(),
  nextBillingDate: new Date(Date.now() + 5 * 86400000).toISOString(),
  totalPaid: 0,
  balance: 0,
  transactions: [],
  billingProvider: 'mock',
};

const MOCK_USERS_STORAGE_KEY = 'speakeasy_admin_users';

const DEFAULT_MOCK_USERS: AppUser[] = [
  MOCK_ADMIN,
  {
    id: '2', name: 'Mario Rossi', email: 'mario@example.com', role: 'user_pro',
    notifications: true, registeredAt: '2024-06-10T08:00:00Z', lastAccess: '2025-03-20T14:30:00Z',
    whatsapp: '+39 340 5556677',
    plan: 'premium_monthly', subscriptionStatus: 'active', billingProvider: 'stripe',
    subscriptionStart: '2025-02-20T10:00:00Z',
    subscriptionEnd: '2025-04-20T10:00:00Z',
    nextBillingDate: '2025-04-20T10:00:00Z',
    totalPaid: 23.97, balance: 23.97,
    transactions: [
      { id: 't1', date: '2025-01-20T10:00:00Z', description: 'Premium Monthly', amount: 7.99, status: 'completed', reference: 'PAY-M1A2B3', planType: 'premium_monthly' },
      { id: 't2', date: '2025-02-20T10:00:00Z', description: 'Premium Monthly', amount: 7.99, status: 'completed', reference: 'PAY-M4D5E6', planType: 'premium_monthly' },
      { id: 't3', date: '2025-03-20T10:00:00Z', description: 'Premium Monthly', amount: 7.99, status: 'completed', reference: 'PAY-M7F8G9', planType: 'premium_monthly' },
    ],
  },
  {
    id: '3', name: 'Giulia Bianchi', email: 'giulia@example.com', role: 'user',
    notifications: false, registeredAt: '2025-01-22T12:00:00Z', lastAccess: '2025-03-19T09:15:00Z',
    plan: 'premium_yearly', subscriptionStatus: 'active', billingProvider: 'apple',
    subscriptionStart: '2025-01-22T12:00:00Z',
    subscriptionEnd: '2026-01-22T12:00:00Z',
    nextBillingDate: '2026-01-22T12:00:00Z',
    totalPaid: 49.99, balance: 49.99,
    transactions: [
      { id: 't4', date: '2025-01-22T12:00:00Z', description: 'Premium Yearly', amount: 49.99, status: 'completed', reference: 'PAY-Y1X2Z3', planType: 'premium_yearly' },
    ],
  },
  {
    id: '4', name: 'Luca Verdi', email: 'luca@example.com', role: 'user',
    notifications: true, registeredAt: '2025-02-10T08:00:00Z', lastAccess: '2025-03-18T16:00:00Z',
    plan: 'free', subscriptionStatus: 'expired', billingProvider: 'googleplay',
    subscriptionStart: '2025-02-10T08:00:00Z',
    subscriptionEnd: '2025-02-17T08:00:00Z',
    totalPaid: 0, balance: 0, transactions: [],
  },
  {
    id: '5', name: 'Sara Neri', email: 'sara@example.com', role: 'user',
    notifications: true, registeredAt: '2025-03-01T09:00:00Z', lastAccess: '2025-03-21T11:00:00Z',
    plan: 'free', subscriptionStatus: 'cancelled', billingProvider: 'mock',
    totalPaid: 0, balance: 0, transactions: [],
  },
];

const cloneUsers = (users: AppUser[]) => users.map(user => ({
  ...user,
  transactions: user.transactions.map(transaction => ({ ...transaction })),
}));

const loadMockUsers = () => {
  if (typeof window === 'undefined') return cloneUsers(DEFAULT_MOCK_USERS);

  try {
    const stored = window.localStorage.getItem(MOCK_USERS_STORAGE_KEY);
    if (!stored) return cloneUsers(DEFAULT_MOCK_USERS);
    const parsed = JSON.parse(stored) as AppUser[];
    return Array.isArray(parsed) ? cloneUsers(parsed) : cloneUsers(DEFAULT_MOCK_USERS);
  } catch {
    return cloneUsers(DEFAULT_MOCK_USERS);
  }
};

const MOCK_USERS: AppUser[] = loadMockUsers();

export const getMockUsers = () => MOCK_USERS;

export const saveMockUsers = (users: AppUser[]) => {
  MOCK_USERS.splice(0, MOCK_USERS.length, ...cloneUsers(users));
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
  }
  return MOCK_USERS;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      guestMode: false,

  login: async (email, _password) => {
    if (!DEMO_MODE) return false;
    if (!_password) return false;

    const normalizedEmail = email.trim().toLowerCase();
    const ADMIN_EMAIL = 'acdigital.app@gmail.com';

    if (normalizedEmail === ADMIN_EMAIL) {
      // Real admin password is validated server-side via Supabase Auth.
      // Demo mock login only requires a non-empty password here.
      const existing = getMockUsers().find(u => u.email.toLowerCase() === ADMIN_EMAIL);
      const adminUser: AppUser = {
        ...MOCK_ADMIN,
        ...(existing ?? {}),
        email: ADMIN_EMAIL,
        role: 'admin',
        lastAccess: new Date().toISOString(),
      };
      const others = getMockUsers().filter(u => u.email.toLowerCase() !== ADMIN_EMAIL);
      saveMockUsers([adminUser, ...others]);
      setAdminCredentials(adminUser.email, _password);
      set({ currentUser: adminUser, isAuthenticated: true });
      return true;
    }

    const found = getMockUsers().find(u => u.email.toLowerCase() === normalizedEmail);
    if (found) {
      if (found.role === 'admin') return false;
      set({ currentUser: { ...found, lastAccess: new Date().toISOString() }, isAuthenticated: true });
      return true;
    }
    const newUser: AppUser = {
      id: Date.now().toString(),
      name: email.split('@')[0],
      email,
      role: 'user',
      notifications: true,
      registeredAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
      plan: 'free',
      subscriptionStatus: 'expired',
      totalPaid: 0,
      balance: 0,
      transactions: [],
    };
    saveMockUsers([...getMockUsers(), newUser]);
    set({ currentUser: newUser, isAuthenticated: true });
    return true;
  },

  register: async (data) => {
    const newUser: AppUser = {
      id: Date.now().toString(),
      name: data.name,
      email: data.email,
      role: 'user',
      whatsapp: data.whatsapp,
      notifications: true,
      registeredAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
      plan: 'free',
      subscriptionStatus: 'expired',
      totalPaid: 0,
      balance: 0,
      transactions: [],
    };
    saveMockUsers([...getMockUsers(), newUser]);
    set({ currentUser: newUser, isAuthenticated: true });
    import('@/lib/notifyAdmin').then(({ notifyAdmin }) => {
      notifyAdmin('new_signup', `signup-${newUser.id}`, {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        whatsapp: newUser.whatsapp,
        plan: newUser.plan,
        provider: 'email',
      });
    });
    return true;
  },

  logout: () => { clearAdminCredentials(); set({ currentUser: null, isAuthenticated: false }); },
  setGuestMode: (v) => set({ guestMode: v }),
  updateUser: (data) => {
    const { currentUser } = get();
    if (currentUser) {
      set({ currentUser: { ...currentUser, ...data } });
    }
  },
    }),
    {
      name: 'speakeasy_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        guestMode: state.guestMode,
      }),
      // HARD OVERRIDE: garantisce che l'email admin ufficiale resti admin
      // anche se in localStorage il ruolo fosse stato sovrascritto.
      onRehydrateStorage: () => (state) => {
        if (state?.currentUser?.email?.toLowerCase() === 'acdigital.app@gmail.com') {
          state.currentUser = { ...state.currentUser, role: 'admin' };
        }
      },
    }
  )
);


// ============================================================================
// TAPPA 1 — Auth reale doppio binario (NON ATTIVO)
// ----------------------------------------------------------------------------
// Helper esposti per la futura migrazione a Supabase Auth reale.
// Nessuna di queste funzioni viene chiamata automaticamente dall'app finché
// DEMO_MODE = true. Sostituiranno il flusso mock solo nelle tappe successive.
// ============================================================================

const SUPABASE_ADMIN_EMAIL = 'acdigital.app@gmail.com';

export type SupabaseAuthResult = {
  ok: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
};

/** Login reale via Supabase Auth. Non usato finché DEMO_MODE = true. */
export const signInWithSupabase = async (
  email: string,
  password: string,
): Promise<SupabaseAuthResult> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user, session: data.session };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
};

/** Signup reale via Supabase Auth con redirect post-conferma email. */
export const signUpWithSupabase = async (
  email: string,
  password: string,
  metadata?: { name?: string; whatsapp?: string },
): Promise<SupabaseAuthResult> => {
  try {
    const redirectTo =
      typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: metadata ?? {},
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, user: data.user, session: data.session };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
};

/** Logout reale via Supabase Auth. */
export const signOutSupabase = async (): Promise<{ ok: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
};

/** Restituisce la sessione Supabase corrente (se presente). */
export const getSupabaseSession = async (): Promise<Session | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  } catch {
    return null;
  }
};

/**
 * Inizializza un listener Supabase onAuthStateChange.
 * NON viene invocato automaticamente: le tappe successive lo monteranno
 * all'avvio dell'app PRIMA di getSession().
 */
export const initializeSupabaseAuthListener = (
  onChange: (session: Session | null) => void,
) => {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session);
  });
  return () => sub.subscription.unsubscribe();
};

// ---------------------------------------------------------------------------
// Ruoli reali (letti dal DB)
// ---------------------------------------------------------------------------

/**
 * Restituisce il ruolo principale di un utente Supabase reale.
 * Schema: user_roles.user_id = profiles.id, profiles.user_id = auth.users.id.
 */
export const fetchUserRole = async (
  authUserId: string,
): Promise<UserRole | null> => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUserId)
      .is('deleted_at', null)
      .maybeSingle();
    if (profileError || !profile?.id) return null;

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile.id);
    if (rolesError || !roles || roles.length === 0) return 'user';

    if (roles.some((r) => r.role === 'admin')) return 'admin';
    if (roles.some((r) => r.role === 'user_pro')) return 'user_pro';
    return 'user';
  } catch {
    return null;
  }
};

/** True se l'utente Supabase reale ha ruolo admin. */
export const isSupabaseAdmin = async (authUserId: string): Promise<boolean> => {
  const role = await fetchUserRole(authUserId);
  return role === 'admin';
};

// ---------------------------------------------------------------------------
// Cleanup storage demo (NON ESEGUITA AUTOMATICAMENTE)
// ---------------------------------------------------------------------------

/**
 * Rimuove le chiavi del flusso demo da localStorage.
 * Da chiamare SOLO nella tappa finale, dopo lo switch ad Auth reale.
 */
export const cleanupDemoAuthStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('speakeasy_auth');
    window.localStorage.removeItem('speakeasy_admin_users');
  } catch {
    /* noop */
  }
};

// Riferimento per evitare warning di unused import.
void SUPABASE_ADMIN_EMAIL;
