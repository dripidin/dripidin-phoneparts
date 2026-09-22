// Delivery Provider Registry & Factory (Backward-Compatibility Facade)
// Delegates to provider-neutral LogisticsProviderRegistry in @/lib/logistics

import type { DeliveryProvider } from './types';
import { LogisticsProviderRegistry } from '@/lib/logistics/registry';
import { EcoTrackDeliveryProvider } from '@/lib/logistics/adapters/ecotrack';

export class DeliveryProviderRegistry {
  /**
   * Register a new courier adapter implementation
   */
  static registerProvider(provider: any): void {
    LogisticsProviderRegistry.registerProvider(provider);
  }

  /**
   * Resolve an active provider instance by code (defaults to ECOTRACK)
   */
  static getProvider(providerCode: string = 'ECOTRACK'): any {
    return LogisticsProviderRegistry.getProvider(providerCode);
  }

  /**
   * List all registered logistics providers
   */
  static listProviders(): Array<{ code: string; name: string }> {
    return LogisticsProviderRegistry.listProviders().map(p => ({
      code: p.code,
      name: p.name,
    }));
  }
}
