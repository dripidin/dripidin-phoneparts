// DRIPIDIN Shipping Rules Engine
// Provider-Agnostic Logistics Policy & Eligibility Evaluation

import type { ShippingAddress, ShippingMethod, DeliveryType } from './types';
import { AddressService } from './address';
import { MoneyMath } from '@/lib/money';
import type { Money } from '@/lib/money/types';

function isMoney(val: unknown): val is Money {
  return (
    typeof val === 'object' &&
    val !== null &&
    'amount' in val &&
    'currency' in val &&
    typeof (val as any).amount === 'number'
  );
}

export class ShippingRulesEngine {
  /**
   * Check if destination is supported by store logistics
   */
  static isServiceableDestination(address: Partial<ShippingAddress>): boolean {
    const countryCode = address.countryCode || 'DZ';
    const profile = AddressService.getProfile(countryCode);

    if (!profile) return false;

    if (countryCode === 'DZ') {
      const code = Number(address.administrativeAreaCode);
      return !isNaN(code) && code >= 1 && code <= 58;
    }

    return true;
  }

  /**
   * Determine available shipping methods for a destination
   */
  static getAvailableShippingMethods(address: Partial<ShippingAddress>): ShippingMethod[] {
    const countryCode = address.countryCode || 'DZ';
    const wilayaCode = Number(address.administrativeAreaCode) || 16;

    // Saharan / Grand Sud extended transit times
    const isGrandSud = [11, 33, 37, 49, 50, 52, 53, 54, 55, 56, 57, 58].includes(wilayaCode);
    const isAlger = wilayaCode === 16;

    const minDaysHome = isAlger ? 1 : isGrandSud ? 3 : 2;
    const maxDaysHome = isAlger ? 2 : isGrandSud ? 5 : 3;

    const minDaysDesk = isAlger ? 1 : isGrandSud ? 2 : 1;
    const maxDaysDesk = isAlger ? 2 : isGrandSud ? 4 : 2;

    const methods: ShippingMethod[] = [
      {
        id: 'standard-home',
        type: 'HOME',
        name: 'Livraison à Domicile / Atelier',
        description: isAlger
          ? 'Remise en mains propres rapide (24h - 48h)'
          : isGrandSud
          ? 'Acheminement sécurisé Grand Sud (3 à 5 jours)'
          : 'Remise en mains propres (48h - 72h)',
        estimatedDaysMin: minDaysHome,
        estimatedDaysMax: maxDaysHome,
      },
      {
        id: 'stopdesk-pickup',
        type: 'DESK',
        name: 'Retrait au Bureau Stopdesk',
        description: 'Retrait en agence de messagerie locale partenaire',
        estimatedDaysMin: minDaysDesk,
        estimatedDaysMax: maxDaysDesk,
      },
    ];

    return methods;
  }

  /**
   * Verify if Cash On Delivery (COD) is permitted for the given address and store setting
   */
  static isCodAllowed(
    address: Partial<ShippingAddress>,
    storeAllowsCod: boolean = true
  ): boolean {
    if (!storeAllowsCod) return false;

    const countryCode = address.countryCode || 'DZ';
    const profile = AddressService.getProfile(countryCode);

    return Boolean(profile.commerceRules.codAvailable);
  }

  /**
   * Evaluate whether free shipping applies based on cart subtotal and threshold
   */
  static isFreeShippingEligible(
    subtotal: Money,
    threshold?: Money | null
  ): boolean {
    if (!threshold || !isMoney(threshold) || threshold.amount <= 0) {
      return false;
    }

    if (subtotal.currency !== threshold.currency) {
      // Different currencies without FX; cannot safely evaluate, default false
      return false;
    }

    return MoneyMath.compare(subtotal, threshold) >= 0;
  }
}
