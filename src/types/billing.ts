export type BillingProvider = 'mock' | 'sumup' | 'apple' | 'googleplay';

export type PlatformType = 'web' | 'ios' | 'android';

export type SubscriptionCatalogItem = {
  id: string;
  planType: 'premium_monthly' | 'premium_yearly';
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  providerProductIds: {
    sumup: string;
    apple: string;
    googleplay: string;
  };
};

export type PurchaseSession = {
  id: string;
  provider: BillingProvider;
  planType: string;
  status: 'pending' | 'completed' | 'cancelled' | 'failed';
  createdAt: string;
  completedAt?: string;
  providerSessionId?: string;
};

export type BillingReceipt = {
  id: string;
  provider: BillingProvider;
  planType: string;
  amount: number;
  currency: string;
  date: string;
  providerTransactionId?: string;
};

export type EntitlementState = {
  isPremium: boolean;
  planType: string;
  provider: BillingProvider;
  expiresAt?: string;
  isTrialing: boolean;
};

export type RestorePurchasesResult = {
  success: boolean;
  restoredPlan?: string;
  provider: BillingProvider;
  message: string;
};

export type BillingProviderInterface = {
  readonly provider: BillingProvider;
  readonly isAvailable: boolean;
  loadProducts(): Promise<SubscriptionCatalogItem[]>;
  startPurchase(planId: string): Promise<PurchaseSession>;
  restorePurchases(): Promise<RestorePurchasesResult>;
  cancelSubscription(): Promise<boolean>;
  getEntitlements(): Promise<EntitlementState>;
  getCustomerPortalUrl?(): Promise<string | null>;
};
