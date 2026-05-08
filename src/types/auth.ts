import type { BillingProvider } from './billing';

export type UserRole = 'admin' | 'user_pro' | 'user';

export type PlanType = 'free' | 'trial' | 'premium' | 'pro' | 'monthly' | 'yearly' | 'premium_monthly' | 'premium_yearly';
export type SubscriptionStatus = 'active' | 'inactive' | 'trialing' | 'in_trial' | 'canceled' | 'cancelled' | 'expired';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  whatsapp?: string;
  notifications: boolean;
  avatarUrl?: string;
  registeredAt: string;
  lastAccess: string;
  // Subscription fields
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  trialStart?: string;
  trialEnd?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  nextBillingDate?: string;
  totalPaid: number;
  balance: number;
  transactions: UserPaymentTransaction[];
  billingProvider?: BillingProvider;
};

export type UserPaymentTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
  planType: PlanType;
};

export type RevenueSummary = {
  totalRevenue: number;
  totalBalance: number;
  payingUsers: number;
  revenueLast30Days: number;
  activeTrials: number;
  expiredSubscriptions: number;
};

export type BankAccount = {
  id: string;
  holder: string;
  bankName: string;
  iban: string;
  bic: string;
  notes?: string;
  createdAt: string;
};

export type PayPalAccount = {
  id: string;
  email: string;
  holder: string;
  notes?: string;
};

export type BankTransaction = {
  id: string;
  accountId: string;
  date: string;
  amount: number;
  description: string;
  status: 'completata' | 'in_attesa' | 'fallita';
  reference: string;
};

export type AdminLog = {
  id: string;
  date: string;
  user: string;
  action: string;
  detail: string;
};

export type CheckoutState = {
  selectedPlan: PlanType;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  cardName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  country: string;
  termsAccepted: boolean;
};
