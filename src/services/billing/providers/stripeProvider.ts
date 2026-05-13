import type { BillingProviderInterface, SubscriptionCatalogItem, PurchaseSession, RestorePurchasesResult, EntitlementState } from '@/types/billing';
import { SUBSCRIPTION_CATALOG, STRIPE_CUSTOMER_PORTAL_URL } from '@/config/subscriptions';
import { supabase } from '@/integrations/supabase/client';

// Stripe live integration: lo stato "available" è sempre true sul web — la verifica
// reale dei secrets (STRIPE_SECRET_KEY, price IDs) avviene server-side nell'edge function.
export const stripeProvider: BillingProviderInterface = {
  provider: 'stripe',
  get isAvailable() { return true; },

  async loadProducts(): Promise<SubscriptionCatalogItem[]> {
    return SUBSCRIPTION_CATALOG;
  },

  async startPurchase(planId: string): Promise<PurchaseSession> {
    // planId atteso: 'premium_monthly' | 'premium_yearly' (legacy) oppure 'monthly' | 'yearly'
    const plan = planId.includes('yearly') ? 'yearly' : 'monthly';

    const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
      body: { plan },
    });
    if (error) throw new Error(error.message || 'Stripe checkout failed');
    const url = (data as any)?.checkout_url;
    if (!url) throw new Error('checkout_url mancante');

    // Redirect immediato al checkout Stripe.
    window.location.href = url;

    return {
      id: (data as any)?.session_id || Date.now().toString(),
      provider: 'stripe',
      planType: planId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
  },

  async restorePurchases(): Promise<RestorePurchasesResult> {
    return { success: false, provider: 'stripe', message: 'Il ripristino acquisti non è necessario per Stripe. Lo stato è sincronizzato automaticamente via webhook.' };
  },

  async cancelSubscription(): Promise<boolean> {
    throw new Error('Utilizza il Customer Portal di Stripe per gestire il tuo abbonamento.');
  },

  async getEntitlements(): Promise<EntitlementState> {
    return { isPremium: false, planType: 'free', provider: 'stripe', isTrialing: false };
  },

  async getCustomerPortalUrl(): Promise<string | null> {
    return STRIPE_CUSTOMER_PORTAL_URL || null;
  },
};
