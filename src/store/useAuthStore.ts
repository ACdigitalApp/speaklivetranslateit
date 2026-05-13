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
    const ADMIN_PASSWORD = 'acdigital2026';

    if (normalizedEmail === ADMIN_EMAIL) {
      if (_password !== ADMIN_PASSWORD) return false;
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

