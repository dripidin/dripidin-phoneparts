// Authoritative Delivery Pricing Service (Backward-Compatibility Facade)
// Delegates directly to the provider-agnostic ShippingRateCalculator in @/lib/logistics

import type { DeliveryType } from '@/types/database.types';
import {
  ShippingRateCalculator,
  type CalculateShippingRateParams,
  type LegacyDeliveryRateResult as DeliveryRateResult,
} from '@/lib/logistics/rate-calculator';

export type { DeliveryRateResult };
export type CalculateDeliveryCostParams = CalculateShippingRateParams;

export class DeliveryPricingService {
  /**
   * Authoritative pricing resolver for a specific Wilaya and Delivery Method
   */
  static calculateDeliveryCost(params: CalculateShippingRateParams): DeliveryRateResult {
    return ShippingRateCalculator.calculateLegacyRate(params);
  }

  /**
   * Get complete 58 Wilayas rate matrix for Admin & Public Rate display
   */
  static getAllWilayaRates(
    deliveryType: DeliveryType = 'HOME',
    providerCode: string = 'ECOTRACK'
  ): DeliveryRateResult[] {
    return ShippingRateCalculator.getAllWilayaRates(deliveryType, providerCode);
  }
}
