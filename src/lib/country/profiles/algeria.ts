// DRIPIDIN Algeria Country Profile (DZ)
// Authoritative implementation preserving all existing 58-Wilaya, phone,
// and COD commerce workflows for Algeria.

import type { CountryProfile, AddressSubdivisionRef } from '../types';
import { ALGERIA_WILAYAS } from '@/lib/utils';

export function cleanAlgerianPhone(val: unknown): string {
  if (typeof val !== 'string') return '';
  const cleaned = val.replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.startsWith('+2130')) {
    return '0' + cleaned.slice(5);
  }
  if (cleaned.startsWith('+213')) {
    return '0' + cleaned.slice(4);
  }
  if (cleaned.startsWith('002130')) {
    return '0' + cleaned.slice(6);
  }
  if (cleaned.startsWith('00213')) {
    return '0' + cleaned.slice(5);
  }
  return cleaned;
}

export const ALGERIAN_MOBILE_REGEX = /^(0)(5|6|7)[0-9]{8}$/;

export const algeriaProfile: CountryProfile = {
  code: 'DZ',
  name: 'Algérie',
  defaultLocale: 'fr-DZ',
  defaultCurrencyCode: 'DZD',
  defaultTimezone: 'Africa/Algiers',

  phone: {
    dialCode: '+213',
    regex: ALGERIAN_MOBILE_REGEX,
    formatPlaceholder: '0550 12 34 56',
    clean: cleanAlgerianPhone,
    validate(input: unknown): boolean {
      const cleaned = cleanAlgerianPhone(input);
      return ALGERIAN_MOBILE_REGEX.test(cleaned);
    },
  },

  address: {
    subdivisionType: 'WILAYA',
    subdivisionLabel: 'Wilaya',
    subdivisionUnitLabel: 'Commune',
    requiresPostalCode: false,
    getSubdivisions(): AddressSubdivisionRef[] {
      return ALGERIA_WILAYAS.map(w => ({
        code: w.code,
        name: w.name,
      }));
    },
  },

  fiscal: {
    identifiers: [
      {
        key: 'RC',
        label: 'Registre de Commerce (RC)',
        requiredForB2b: true,
        formatDescription: 'Numéro de registre du tribunal de commerce',
      },
      {
        key: 'NIF',
        label: 'Numéro d\'Identification Fiscale (NIF)',
        requiredForB2b: false,
        formatDescription: 'Identifiant fiscal à 15 chiffres',
      },
      {
        key: 'NIS',
        label: 'Numéro d\'Identification Statistique (NIS)',
        requiredForB2b: false,
      },
      {
        key: 'ARTICLE_IMPOSITION',
        label: 'Article d\'Imposition',
        requiredForB2b: false,
      },
    ],
    defaultTaxRatePercent: 0.0,
  },

  commerceRules: {
    codAvailable: true,
    requiresNationalIdentity: false,
    defaultDeliveryType: 'HOME',
  },
};
