// DRIPIDIN Logistics Address Model & Geography Integration
// Bridges generic ShippingAddress with CountryProfile regional semantics

import { CountryRegistry } from '@/lib/country/registry';
import type { CountryProfile } from '@/lib/country/types';
import type { ShippingAddress } from './types';
import { ALGERIA_WILAYAS } from '@/lib/utils';

export class AddressService {
  /**
   * Resolve CountryProfile for the address, defaulting to Algeria ('DZ')
   */
  static getProfile(countryCode?: string): CountryProfile {
    return CountryRegistry.get(countryCode || 'DZ');
  }

  /**
   * Validate a ShippingAddress against regional CountryProfile constraints
   */
  static validateAddress(address: Partial<ShippingAddress>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const countryCode = address.countryCode || 'DZ';
    const profile = this.getProfile(countryCode);

    // 1. Recipient Name
    if (!address.recipientName || address.recipientName.trim().length < 2) {
      errors.push('Le nom du destinataire est requis (au moins 2 caractères).');
    }

    // 2. Recipient Phone using CountryProfile phone rules
    if (!address.recipientPhone || !profile.phone.validate(address.recipientPhone)) {
      errors.push(
        `Numéro de téléphone invalide pour ${profile.name}. Format attendu : ${profile.phone.formatPlaceholder}`
      );
    }

    // 3. Street Address Line
    if (!address.addressLine1 || address.addressLine1.trim().length < 5) {
      errors.push("L'adresse de livraison détaillée est requise (au moins 5 caractères).");
    }

    // 4. Locality / City / Commune
    if (!address.localityName || address.localityName.trim().length < 2) {
      errors.push(`Le champ ${profile.address.subdivisionUnitLabel} est requis.`);
    }

    // 5. Postal Code requirement (e.g. required in France, optional in Algeria)
    if (profile.address.requiresPostalCode) {
      if (!address.postalCode) {
        errors.push('Le code postal est obligatoire pour ce pays.');
      } else if (profile.address.postalCodeRegex && !profile.address.postalCodeRegex.test(address.postalCode)) {
        errors.push('Format de code postal invalide.');
      }
    }

    // 6. Regional Subdivision check (e.g. 58 Wilayas in Algeria)
    if (profile.code === 'DZ') {
      const wilayaNum = Number(address.administrativeAreaCode);
      if (!wilayaNum || isNaN(wilayaNum) || wilayaNum < 1 || wilayaNum > 58) {
        errors.push('Le code de Wilaya doit être compris entre 1 et 58.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalizes an address, resolving administrative area names and cleaning phone strings
   */
  static normalizeAddress(address: Partial<ShippingAddress>): ShippingAddress {
    const countryCode = (address.countryCode || 'DZ').toUpperCase();
    const profile = this.getProfile(countryCode);

    let adminCode = address.administrativeAreaCode;
    let adminName = address.administrativeAreaName;

    // Algeria specific resolution
    if (countryCode === 'DZ') {
      const codeNum = Number(adminCode);
      if (codeNum >= 1 && codeNum <= 58) {
        const found = ALGERIA_WILAYAS.find(w => w.code === codeNum);
        if (found) {
          adminCode = found.code;
          adminName = found.name;
        }
      } else if (adminName) {
        const found = ALGERIA_WILAYAS.find(
          w => w.name.toLowerCase() === adminName?.toLowerCase()
        );
        if (found) {
          adminCode = found.code;
          adminName = found.name;
        }
      }
    }

    return {
      countryCode,
      administrativeAreaCode: adminCode,
      administrativeAreaName: adminName,
      localityCode: address.localityCode,
      localityName: (address.localityName || '').trim(),
      postalCode: address.postalCode?.trim(),
      addressLine1: (address.addressLine1 || '').trim(),
      addressLine2: address.addressLine2?.trim() || null,
      recipientName: (address.recipientName || '').trim(),
      recipientPhone: profile.phone.clean(address.recipientPhone || ''),
      recipientPhoneSecondary: address.recipientPhoneSecondary
        ? profile.phone.clean(address.recipientPhoneSecondary)
        : null,
    };
  }

  /**
   * Convert an existing Order database record into a typed ShippingAddress
   */
  static fromOrderRecord(order: {
    recipient_name?: string;
    recipient_phone?: string;
    recipient_phone_secondary?: string | null;
    shipping_address_line?: string;
    wilaya_code?: number;
    wilaya_name?: string;
    commune_name?: string;
    country_code?: string;
  }): ShippingAddress {
    return this.normalizeAddress({
      countryCode: order.country_code || 'DZ',
      administrativeAreaCode: order.wilaya_code,
      administrativeAreaName: order.wilaya_name,
      localityName: order.commune_name || '',
      addressLine1: order.shipping_address_line || '',
      recipientName: order.recipient_name || '',
      recipientPhone: order.recipient_phone || '',
      recipientPhoneSecondary: order.recipient_phone_secondary,
    });
  }

  /**
   * Convert a ShippingAddress into order snapshot fields for database persistence
   */
  static toOrderSnapshot(address: ShippingAddress): {
    recipient_name: string;
    recipient_phone: string;
    recipient_phone_secondary: string | null;
    shipping_address_line: string;
    wilaya_code: number;
    wilaya_name: string;
    commune_name: string;
  } {
    const fullStreet = address.addressLine2
      ? `${address.addressLine1}, ${address.addressLine2}`
      : address.addressLine1;

    return {
      recipient_name: address.recipientName,
      recipient_phone: address.recipientPhone,
      recipient_phone_secondary: address.recipientPhoneSecondary || null,
      shipping_address_line: fullStreet,
      wilaya_code: Number(address.administrativeAreaCode) || 16,
      wilaya_name: address.administrativeAreaName || 'Alger',
      commune_name: address.localityName,
    };
  }
}
