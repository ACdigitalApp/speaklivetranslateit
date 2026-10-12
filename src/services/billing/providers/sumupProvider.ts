import type { BillingProviderInterface, SubscriptionCatalogItem, PurchaseSession, RestorePurchasesResult, EntitlementState } from '@/types/billing';
import { SUBSCRIPTION_CATALOG } from '@/config/subscriptions';
import { supabase } from '@/integrations/supabase/client';

const PENDING_KEY = 'sumup_pending_checkout';

export async function startSumUpCheckout(plan: 'monthly' | 'yearly'): Promise<string> {
  const { data, error } = await supabase.functions.invoke('sumup-checkout', { body: { action: 'create', plan } });
  if (error) throw new Error(error.message || 'Checkout SumUp non disponibile');
  const url = (data as any)?.checkout_url;
  const id = (data as any)?.checkout_id;
  if (!url || !id) throw new Error('checkout_url mancante');
  localStorage.setItem(PENDING_KEY, id);
  window.location.href = url;
  return id;
}

export async function verifySumUpCheckout(checkoutId?: string | null) {
  const id = checkoutId || localStorage.getItem(PENDING_KEY);
  if (!id) return { status: 'none' as const, premium: false };
  const { data, error } = await supabase.functions.invoke('sumup-checkout', { body: { action: 'verify', checkout_id: id } });
  if (error) throw new Error(error.message);
  if ((data as any)?.premium) localStorage.removeItem(PENDING_KEY);
  return data as { status: string; premium: boolean; plan?: string };
}

export const sumupProvider: BillingProviderInterface = {
  provider: 'sumup',
  get isAvailable() { return true; },
  async loadProducts(): Promise<SubscriptionCatalogItem[]> { return SUBSCRIPTION_CATALOG; },
  async startPurchase(planId: string): Promise<PurchaseSession> {
    const id = await startSumUpCheckout(planId.includes('yearly') ? 'yearly' : 'monthly');
    return { id, provider: 'sumup', planType: planId, status: 'pending', createdAt: new Date().toISOString() };
  },
  async restorePurchases(): Promise<RestorePurchasesResult> {
    const r = await verifySumUpCheckout();
    return r.premium
      ? { success: true, provider: 'sumup', restoredPlan: r.plan, message: 'Premium attivato.' }
      : { success: false, provider: 'sumup', message: 'Nessun pagamento SumUp completato da ripristinare.' };
  },
  async cancelSubscription(): Promise<boolean> { return true; },
  async getEntitlements(): Promise<EntitlementState> {
    return { isPremium: false, planType: 'free', provider: 'sumup', isTrialing: false };
  },
};
