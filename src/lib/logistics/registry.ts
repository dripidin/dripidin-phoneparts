// DRIPIDIN Logistics Delivery Provider Registry
// Resolves courier adapters dynamically without coupling business logic to concrete providers

import type { IDeliveryProvider } from './contracts';
import { EcoTrackDeliveryProvider } from './adapters/ecotrack';

export class LogisticsProviderRegistry {
  private static providers: Map<string, IDeliveryProvider> = new Map();
  private static defaultProviderCode: string = 'ECOTRACK';

  static {
    // Register default concrete provider
    const ecoTrack = new EcoTrackDeliveryProvider();
    this.registerProvider(ecoTrack);
  }

  /**
   * Register a new delivery provider adapter
   */
  static registerProvider(provider: IDeliveryProvider): void {
    this.providers.set(provider.providerCode.toUpperCase(), provider);
  }

  /**
   * Check if a provider is registered
   */
  static hasProvider(providerCode: string): boolean {
    return this.providers.has(providerCode.toUpperCase());
  }

  /**
   * Resolve an active provider adapter by code (defaults to ECOTRACK)
   */
  static getProvider(providerCode: string = this.defaultProviderCode): IDeliveryProvider {
    const code = (providerCode || this.defaultProviderCode).toUpperCase();
    const provider = this.providers.get(code);

    if (!provider) {
      // Fallback to default if available
      const defaultProv = this.providers.get(this.defaultProviderCode);
      if (defaultProv) return defaultProv;
      throw new Error(`Fournisseur de livraison non reconnu : ${providerCode}`);
    }

    return provider;
  }

  /**
   * List all registered delivery providers and their capabilities
   */
  static listProviders(): Array<{
    code: string;
    name: string;
    capabilities: IDeliveryProvider['capabilities'];
  }> {
    return Array.from(this.providers.values()).map(p => ({
      code: p.providerCode,
      name: p.providerName,
      capabilities: p.capabilities,
    }));
  }
}
