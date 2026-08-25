// Delivery Provider Registry & Factory for HamzaPhone
// Allows dynamic resolution of courier adapters without coupling Order or Warehouse modules

import type { DeliveryProvider } from './types';
import { EcoTrackDeliveryProvider } from './ecotrack-provider';

export class DeliveryProviderRegistry {
  private static providers: Map<string, DeliveryProvider> = new Map();
  private static defaultProviderCode: string = 'ECOTRACK';

  static {
    // Register default concrete providers
    const ecoTrack = new EcoTrackDeliveryProvider();
    this.registerProvider(ecoTrack);
  }

  /**
   * Register a new courier adapter implementation
   */
  static registerProvider(provider: DeliveryProvider): void {
    this.providers.set(provider.providerCode.toUpperCase(), provider);
  }

  /**
   * Resolve an active provider instance by code (defaults to ECOTRACK)
   */
  static getProvider(providerCode: string = this.defaultProviderCode): DeliveryProvider {
    const code = (providerCode || this.defaultProviderCode).toUpperCase();
    const provider = this.providers.get(code);

    if (!provider) {
      // Fallback to default if known
      const defaultProv = this.providers.get(this.defaultProviderCode);
      if (defaultProv) return defaultProv;
      throw new Error(`Fournisseur de livraison non reconnu : ${providerCode}`);
    }

    return provider;
  }

  /**
   * List all registered logistics providers
   */
  static listProviders(): Array<{ code: string; name: string }> {
    return Array.from(this.providers.values()).map(p => ({
      code: p.providerCode,
      name: p.providerName,
    }));
  }
}
