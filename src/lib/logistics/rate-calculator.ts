// DRIPIDIN Shipping Rate Calculator
// Computes destination-specific shipping rates using Phase 3 Money engine

import { createMoney } from '@/lib/money';
import type { Money } from '@/lib/money/types';
import type { DeliveryType } from '@/types/database.types';
import type { ShippingAddress, ShippingMethod, ShippingRate } from './types';
import { AddressService } from './address';
import { ShippingRulesEngine } from './rules';
import { ALGERIA_WILAYAS } from '@/lib/utils';

function isMoney(val: unknown): val is Money {
  return (
    typeof val === 'object' &&
    val !== null &&
    'amount' in val &&
    'currency' in val &&
    typeof (val as any).amount === 'number'
  );
}

export interface CalculateShippingRateParams {
  address?: Partial<ShippingAddress>;
  wilayaCode?: number;
  deliveryType?: DeliveryType;
  subtotal?: Money | number;
  subtotalDzd?: number; // legacy alias
  freeShippingThreshold?: Money | number | null;
  freeShippingThresholdDzd?: number | null; // legacy alias
  currencyCode?: string;
  providerCode?: string;
}

export interface LegacyDeliveryRateResult {
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

export class ShippingRateCalculator {
  /**
   * Authoritative rate calculation returning strongly-typed ShippingRate with Money
   */
  static calculateRate(params: CalculateShippingRateParams): ShippingRate {
    const currency = params.currencyCode || 'DZD';
    const deliveryType: DeliveryType = params.deliveryType || 'HOME';
    const providerCode = (params.providerCode || 'ECOTRACK').toUpperCase();

    // 1. Resolve normalized address
    let normAddress: ShippingAddress;
    if (params.address) {
      normAddress = AddressService.normalizeAddress(params.address);
    } else {
      const wCode = params.wilayaCode || 16;
      normAddress = AddressService.normalizeAddress({
        countryCode: 'DZ',
        administrativeAreaCode: wCode,
      });
    }

    const wilayaCode = Number(normAddress.administrativeAreaCode) || 16;
    const isAlger = wilayaCode === 16;

    // 2. Base Cost Resolution according to destination and delivery method
    let baseAmount = 600;
    if (deliveryType === 'DESK') {
      baseAmount = isAlger ? 300 : 450;
    } else {
      baseAmount = isAlger ? 400 : 600;
    }

    const baseCost = createMoney(baseAmount, currency);

    // 3. Free Shipping Evaluation
    const subtotalRaw = params.subtotal !== undefined ? params.subtotal : params.subtotalDzd;
    let subtotalMoney: Money;
    if (isMoney(subtotalRaw)) {
      subtotalMoney = subtotalRaw;
    } else {
      subtotalMoney = createMoney(Number(subtotalRaw) || 0, currency);
    }

    const thresholdRaw =
      params.freeShippingThreshold !== undefined
        ? params.freeShippingThreshold
        : params.freeShippingThresholdDzd;

    let thresholdMoney: Money | null = null;
    if (thresholdRaw !== undefined && thresholdRaw !== null) {
      if (isMoney(thresholdRaw)) {
        thresholdMoney = thresholdRaw;
      } else {
        const num = Number(thresholdRaw);
        if (num > 0) {
          thresholdMoney = createMoney(num, currency);
        }
      }
    }

    const isFreeShipping = ShippingRulesEngine.isFreeShippingEligible(
      subtotalMoney,
      thresholdMoney
    );

    const finalCost = isFreeShipping ? createMoney(0, currency) : baseCost;

    // 4. Resolve Shipping Method & Transit Times
    const availableMethods = ShippingRulesEngine.getAvailableShippingMethods(normAddress);
    const matchedMethod =
      availableMethods.find(m => m.type === deliveryType) || availableMethods[0];

    return {
      method: matchedMethod,
      cost: finalCost,
      isFreeShipping,
      providerCode,
      destination: {
        countryCode: normAddress.countryCode,
        administrativeAreaCode: normAddress.administrativeAreaCode,
        administrativeAreaName: normAddress.administrativeAreaName,
      },
    };
  }

  /**
   * Backward-compatible legacy delivery rate calculation for existing callers
   */
  static calculateLegacyRate(params: CalculateShippingRateParams): LegacyDeliveryRateResult {
    const rate = this.calculateRate(params);
    const wilayaCode = Number(rate.destination.administrativeAreaCode) || 16;
    const wilaya = ALGERIA_WILAYAS.find(w => w.code === wilayaCode) || {
      code: wilayaCode,
      name: `Wilaya ${wilayaCode.toString().padStart(2, '0')}`,
    };

    let baseAmount = 600;
    if (rate.method.type === 'DESK') {
      baseAmount = wilayaCode === 16 ? 300 : 450;
    } else {
      baseAmount = wilayaCode === 16 ? 400 : 600;
    }

    return {
      wilayaCode: wilaya.code,
      wilayaName: wilaya.name,
      deliveryType: rate.method.type,
      baseCostDzd: baseAmount,
      finalCostDzd: rate.cost.amount,
      isFreeShipping: rate.isFreeShipping,
      estimatedDaysMin: rate.method.estimatedDaysMin,
      estimatedDaysMax: rate.method.estimatedDaysMax,
      providerCode: rate.providerCode,
    };
  }

  /**
   * Get complete 58 Wilayas rate matrix for Admin & Public rate displays
   */
  static getAllWilayaRates(
    deliveryType: DeliveryType = 'HOME',
    providerCode: string = 'ECOTRACK'
  ): LegacyDeliveryRateResult[] {
    return ALGERIA_WILAYAS.map(w =>
      this.calculateLegacyRate({
        wilayaCode: w.code,
        deliveryType,
        providerCode,
      })
    );
  }
}
