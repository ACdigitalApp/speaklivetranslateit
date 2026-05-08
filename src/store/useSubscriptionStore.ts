import { create } from 'zustand';
import type { PlanType, SubscriptionStatus, UserPaymentTransaction, RevenueSummary, AppUser } from '@/types/auth';
import { useAuthStore, getMockUsers } from './useAuthStore';

const generateRef = () => `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const PLAN_PRICES: Partial<Record<PlanType, number>> = {
  free: 0,
  trial: 0,
  premium_monthly: 7.99,
  premium_yearly: 49.99,
};

const PLAN_LABELS: Partial<Record<PlanType, string>> = {
  free: 'Free',
  trial: 'Trial (7 giorni)',
  premium_monthly: 'Premium Monthly',
  premium_yearly: 'Premium Yearly',
};

type SubscriptionStore = {
  getRevenueSummary: () => RevenueSummary;
  startTrial: () => void;
  upgradeToMonthly: () => void;
  upgradeToYearly: () => void;
  completeMockCheckout: (plan: PlanType) => void;
  cancelSubscription: () => void;
};

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function addMonths(date: Date, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

function addYears(date: Date, years: number): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

export const useSubscriptionStore = create<SubscriptionStore>(() => ({
  getRevenueSummary: (): RevenueSummary => {
    const users = getMockUsers();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalRevenue = 0;
    let totalBalance = 0;
    let payingUsers = 0;
    let revenueLast30Days = 0;
    let activeTrials = 0;
    let expiredSubscriptions = 0;

    users.forEach(u => {
      totalRevenue += u.totalPaid;
      totalBalance += u.balance;
      if (u.totalPaid > 0) payingUsers++;
      if (u.subscriptionStatus === 'in_trial') activeTrials++;
      if (u.subscriptionStatus === 'expired') expiredSubscriptions++;
      u.transactions.forEach(t => {
        if (t.status === 'completed' && new Date(t.date) >= thirtyDaysAgo) {
          revenueLast30Days += t.amount;
        }
      });
    });

    return { totalRevenue, totalBalance, payingUsers, revenueLast30Days, activeTrials, expiredSubscriptions };
  },

  startTrial: () => {
    const now = new Date();
    useAuthStore.getState().updateUser({
      plan: 'trial',
      subscriptionStatus: 'in_trial',
      trialStart: now.toISOString(),
      trialEnd: addDays(now, 7),
      subscriptionStart: now.toISOString(),
      subscriptionEnd: addDays(now, 7),
      nextBillingDate: addDays(now, 7),
    });
  },

  upgradeToMonthly: () => {
    const now = new Date();
    const tx: UserPaymentTransaction = {
      id: Date.now().toString(),
      date: now.toISOString(),
      description: 'Upgrade a Premium Monthly',
      amount: 7.99,
      status: 'completed',
      reference: generateRef(),
      planType: 'premium_monthly',
    };
    const user = useAuthStore.getState().currentUser;
    useAuthStore.getState().updateUser({
      plan: 'premium_monthly',
      subscriptionStatus: 'active',
      subscriptionStart: now.toISOString(),
      subscriptionEnd: addMonths(now, 1),
      nextBillingDate: addMonths(now, 1),
      totalPaid: (user?.totalPaid || 0) + 7.99,
      balance: (user?.balance || 0) + 7.99,
      transactions: [...(user?.transactions || []), tx],
    });
  },

  upgradeToYearly: () => {
    const now = new Date();
    const tx: UserPaymentTransaction = {
      id: Date.now().toString(),
      date: now.toISOString(),
      description: 'Upgrade a Premium Yearly',
      amount: 49.99,
      status: 'completed',
      reference: generateRef(),
      planType: 'premium_yearly',
    };
    const user = useAuthStore.getState().currentUser;
    useAuthStore.getState().updateUser({
      plan: 'premium_yearly',
      subscriptionStatus: 'active',
      subscriptionStart: now.toISOString(),
      subscriptionEnd: addYears(now, 1),
      nextBillingDate: addYears(now, 1),
      totalPaid: (user?.totalPaid || 0) + 49.99,
      balance: (user?.balance || 0) + 49.99,
      transactions: [...(user?.transactions || []), tx],
    });
  },

  completeMockCheckout: (plan: PlanType) => {
    const store = useSubscriptionStore.getState();
    if (plan === 'trial') store.startTrial();
    else if (plan === 'premium_monthly') store.upgradeToMonthly();
    else if (plan === 'premium_yearly') store.upgradeToYearly();
  },

  cancelSubscription: () => {
    useAuthStore.getState().updateUser({
      plan: 'free',
      subscriptionStatus: 'cancelled',
      nextBillingDate: undefined,
    });
  },
}));

export { PLAN_PRICES, PLAN_LABELS };
