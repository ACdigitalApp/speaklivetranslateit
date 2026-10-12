import type { SubscriptionCatalogItem, PlatformType, BillingProvider } from '@/types/billing';

export const SUBSCRIPTION_CATALOG: SubscriptionCatalogItem[] = [
  {
    id: 'premium_monthly',
    planType: 'premium_monthly',
    name: 'Premium Monthly',
    price: 7.99,
    currency: 'EUR',
    interval: 'month',
    providerProductIds: {
      sumup: 'premium_monthly',
      apple: import.meta.env.VITE_APPLE_MONTHLY_PRODUCT_ID || 'com.speaklivetranslate.premium.monthly',
      googleplay: import.meta.env.VITE_GOOGLEPLAY_MONTHLY_PRODUCT_ID || 'premium_monthly',
    },
  },
  {
    id: 'premium_yearly',
    planType: 'premium_yearly',
    name: 'Premium Yearly',
    price: 49.99,
    currency: 'EUR',
    interval: 'year',
    providerProductIds: {
      sumup: 'premium_yearly',
      apple: import.meta.env.VITE_APPLE_YEARLY_PRODUCT_ID || 'com.speaklivetranslate.premium.yearly',
      googleplay: import.meta.env.VITE_GOOGLEPLAY_YEARLY_PRODUCT_ID || 'premium_yearly',
    },
  },
];

export const BILLING_MODE = (import.meta.env.VITE_BILLING_MODE as string) || 'live';

export function detectPlatform(): PlatformType {
  const ua = navigator.userAgent || '';
  if (typeof (window as any).Capacitor !== 'undefined') {
    const platform = (window as any).Capacitor?.getPlatform?.();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  }
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web';
}

export function getDefaultProvider(platform: PlatformType): BillingProvider {
  if (BILLING_MODE === 'live') {
    if (platform === 'ios') return 'apple';
    if (platform === 'android') return 'googleplay';
    return 'sumup';
  }
  return 'mock';
}

export function getProviderLabel(provider: BillingProvider): string {
  switch (provider) {
    case 'sumup': return 'SumUp';
    case 'apple': return 'App Store';
    case 'googleplay': return 'Google Play';
    case 'mock': return 'Demo';
  }
}

export function getPurchaseCTA(provider: BillingProvider): string {
  switch (provider) {
    case 'sumup': return 'Acquista con SumUp';
    case 'apple': return 'Acquista su App Store';
    case 'googleplay': return 'Acquista su Google Play';
    case 'mock': return 'Demo Checkout';
  }
}

export function getManageLabel(provider: BillingProvider): string {
  switch (provider) {
    case 'sumup': return 'Gestisci abbonamento';
    case 'apple': return "Gestisci il tuo abbonamento dall'App Store";
    case 'googleplay': return 'Gestisci il tuo abbonamento da Google Play';
    case 'mock': return 'Gestisci Abbonamento';
  }
}

export function getUnavailableMessage(provider: BillingProvider): string {
  switch (provider) {
    case 'apple': return "Gli acquisti App Store sono disponibili nell'app iOS pubblicata, non nel preview web.";
    case 'googleplay': return "Gli acquisti Google Play sono disponibili nell'app Android pubblicata, non nel preview web.";
    default: return '';
  }
}
