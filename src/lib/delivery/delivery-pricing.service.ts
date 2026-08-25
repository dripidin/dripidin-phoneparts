// Authoritative Delivery Pricing Service for HamzaPhone across all 58 Algerian Wilayas
// Single Source of Truth for Storefront Cart, Multi-Step Checkout, Admin OMS, and Order Fulfillment

import { ALGERIA_WILAYAS } from '@/lib/utils';
import type { DeliveryType } from '@/types/database.types';

export interface DeliveryRateResult {
  wilayaCode: number;
  wilayaName: string;
  deliveryType: DeliveryType;
  baseCostDzd: number;
  finalCostDzd: number;
  isFreeShipping: boolean;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  providerCode: string;
}

export interface CalculateDeliveryCostParams {
  wilayaCode: number;
  deliveryType?: DeliveryType;
  subtotalDzd?: number;
  freeShippingThresholdDzd?: number | null;
  providerCode?: string;
}

// Southern / Saharan Wilayas with extended transit times
const GRAND_SUD_WILAYAS = [11, 33, 37, 49, 50, 52, 53, 54, 55, 56, 57, 58];

export class DeliveryPricingService {
  /**
   * Authoritative pricing resolver for a specific Wilaya and Delivery Method
   */
  static calculateDeliveryCost({
    wilayaCode,
    deliveryType = 'HOME',
    subtotalDzd = 0,
    freeShippingThresholdDzd = null,
    providerCode = 'ECOTRACK',
  }: CalculateDeliveryCostParams): DeliveryRateResult {
    // 1. Resolve Wilaya Name
    const wilaya = ALGERIA_WILAYAS.find(w => w.code === wilayaCode) || {
      code: wilayaCode,
      name: `Wilaya ${wilayaCode.toString().padStart(2, '0')}`,
    };

    // 2. Base Price Resolution (Algerian Logistics Standard)
    let baseCostDzd = 600; // Standard 57 Wilayas Domicile
    if (deliveryType === 'DESK') {
      baseCostDzd = wilayaCode === 16 ? 300 : 450;
    } else {
      baseCostDzd = wilayaCode === 16 ? 400 : 600;
    }

    // 3. Free shipping threshold evaluation
    const isFreeShipping = Boolean(
      freeShippingThresholdDzd &&
      freeShippingThresholdDzd > 0 &&
      subtotalDzd >= freeShippingThresholdDzd
    );

    const finalCostDzd = isFreeShipping ? 0 : baseCostDzd;

    // 4. Transit time estimation
    let estimatedDaysMin = 1;
    let estimatedDaysMax = 2;

    if (wilayaCode === 16) {
      estimatedDaysMin = 1;
      estimatedDaysMax = 2; // Alger: 24h - 48h
    } else if (GRAND_SUD_WILAYAS.includes(wilayaCode)) {
      estimatedDaysMin = 3;
      estimatedDaysMax = 5; // Sahara / Grand Sud: 3 à 5 jours
    } else {
      estimatedDaysMin = 2;
      estimatedDaysMax = 3; // Nord & Hauts Plateaux: 48h - 72h
    }

    return {
      wilayaCode: wilaya.code,
      wilayaName: wilaya.name,
      deliveryType,
      baseCostDzd,
      finalCostDzd,
      isFreeShipping,
      estimatedDaysMin,
      estimatedDaysMax,
      providerCode,
    };
  }

  /**
   * Get complete 58 Wilayas rate matrix for Admin & Public Rate display
   */
  static getAllWilayaRates(deliveryType: DeliveryType = 'HOME', providerCode: string = 'ECOTRACK'): DeliveryRateResult[] {
    return ALGERIA_WILAYAS.map(w =>
      this.calculateDeliveryCost({
        wilayaCode: w.code,
        deliveryType,
        providerCode,
      })
    );
  }
}
