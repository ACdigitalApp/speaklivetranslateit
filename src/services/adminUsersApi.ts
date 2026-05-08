import { supabase } from '@/integrations/supabase/client';
import type { AppUser } from '@/types/auth';

const ADMIN_EMAIL_KEY = 'admin_email';
const ADMIN_PASSCODE_KEY = 'admin_passcode';

export const setAdminCredentials = (email: string, passcode: string) => {
  try {
    sessionStorage.setItem(ADMIN_EMAIL_KEY, email);
    sessionStorage.setItem(ADMIN_PASSCODE_KEY, passcode);
  } catch { /* noop */ }
};

export const clearAdminCredentials = () => {
  try {
    sessionStorage.removeItem(ADMIN_EMAIL_KEY);
    sessionStorage.removeItem(ADMIN_PASSCODE_KEY);
  } catch { /* noop */ }
};

const adminHeaders = () => {
  const headers: Record<string, string> = {};
  try {
    const email = sessionStorage.getItem(ADMIN_EMAIL_KEY);
    const pw = sessionStorage.getItem(ADMIN_PASSCODE_KEY);
    if (email) headers['x-admin-email'] = email;
    if (pw) headers['x-admin-passcode'] = pw;
  } catch { /* noop */ }
  return headers;
};

type RawUser = Record<string, unknown>;

const mapUser = (raw: RawUser): AppUser => ({
  id: String(raw.id),
  name: (raw.name as string) ?? '',
  email: (raw.email as string) ?? '',
  role: ((raw.role as string) ?? 'user') as AppUser['role'],
  whatsapp: (raw.whatsapp as string) ?? undefined,
  notifications: Boolean(raw.notifications ?? true),
  avatarUrl: (raw.avatarUrl as string) ?? undefined,
  registeredAt: (raw.registeredAt as string) ?? new Date().toISOString(),
  lastAccess: (raw.lastAccess as string) ?? new Date().toISOString(),
  plan: ((raw.plan as string) ?? 'free') as AppUser['plan'],
  subscriptionStatus: ((raw.subscriptionStatus as string) ?? 'inactive') as AppUser['subscriptionStatus'],
  trialStart: (raw.trialStart as string) ?? undefined,
  trialEnd: (raw.trialEnd as string) ?? undefined,
  subscriptionStart: (raw.subscriptionStart as string) ?? undefined,
  subscriptionEnd: (raw.subscriptionEnd as string) ?? undefined,
  nextBillingDate: (raw.nextBillingDate as string) ?? undefined,
  totalPaid: Number(raw.totalPaid ?? 0),
  balance: Number(raw.balance ?? 0),
  transactions: Array.isArray(raw.transactions)
    ? (raw.transactions as RawUser[]).map(t => ({
        id: String(t.id),
        date: String(t.date),
        description: String(t.description ?? ''),
        amount: Number(t.amount ?? 0),
        status: (t.status as 'completed' | 'pending' | 'failed') ?? 'completed',
        reference: String(t.reference ?? ''),
        planType: ((t.planType as string) ?? 'free') as AppUser['plan'],
      }))
    : [],
  billingProvider: ((raw.billingProvider as string) ?? 'mock') as AppUser['billingProvider'],
});

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('admin-users', {
    body,
    headers: adminHeaders(),
  });
  if (error) {
    const msg = (data && typeof data === 'object' && 'error' in data && (data as { error: string }).error)
      || error.message
      || 'Errore backend';
    throw new Error(msg);
  }
  if (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
  return data as { users?: RawUser[]; message?: string };
};

export const adminListUsers = async (): Promise<AppUser[]> => {
  const data = await invoke({ action: 'list' });
  return (data.users ?? []).map(mapUser);
};

export type AdminUserPayload = {
  id?: string;
  name: string;
  email: string;
  role: AppUser['role'];
  phone?: string | null;
  whatsapp?: string | null;
  notifications?: boolean;
  plan: AppUser['plan'];
  billingProvider: NonNullable<AppUser['billingProvider']>;
  subscriptionStatus: AppUser['subscriptionStatus'];
  subscriptionEnd?: string | null;
  totalPaid?: number;
  balance?: number;
};

export const adminCreateUser = async (user: AdminUserPayload): Promise<AppUser[]> => {
  const data = await invoke({ action: 'create', user });
  return (data.users ?? []).map(mapUser);
};

export const adminUpdateUser = async (user: AdminUserPayload): Promise<AppUser[]> => {
  const data = await invoke({ action: 'update', user });
  return (data.users ?? []).map(mapUser);
};

export const adminRemoveUser = async (id: string): Promise<AppUser[]> => {
  const data = await invoke({ action: 'remove', id });
  return (data.users ?? []).map(mapUser);
};
