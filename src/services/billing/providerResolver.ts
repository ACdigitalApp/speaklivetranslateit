import type { BillingProviderInterface, BillingProvider } from '@/types/billing';
import { detectPlatform, getDefaultProvider } from '@/config/subscriptions';
import { mockProvider } from './providers/mockProvider';
import { sumupProvider } from './providers/sumupProvider';
import { appleProvider } from './providers/appleProvider';
import { googlePlayProvider } from './providers/googlePlayProvider';

const providers: Record<BillingProvider, BillingProviderInterface> = {
  mock: mockProvider,
  sumup: sumupProvider,
  apple: appleProvider,
  googleplay: googlePlayProvider,
};

export function getBillingProvider(forceProvider?: BillingProvider): BillingProviderInterface {
  if (forceProvider) return providers[forceProvider];

  const platform = detectPlatform();
  const defaultProvider = getDefaultProvider(platform);
  const provider = providers[defaultProvider];

  // If provider not available, fallback to mock
  if (!provider.isAvailable) return providers.mock;
  return provider;
}

export function getAllProviders(): BillingProviderInterface[] {
  return Object.values(providers);
}

export function isProviderAvailable(provider: BillingProvider): boolean {
  return providers[provider].isAvailable;
}
