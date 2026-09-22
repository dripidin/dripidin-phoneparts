// DRIPIDIN France Reference Profile (FR)
// Architectural reference validating that the CountryProfile abstraction
// natively supports non-Algerian locales, currencies, postal codes, and fiscal systems.

import type { CountryProfile, AddressSubdivisionRef } from '../types';

export function cleanFrenchPhone(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(/[\s\-\.\(\)]/g, '');
}

export const FRENCH_PHONE_REGEX = /^(?:(?:\+|00)33|0)[1-9][0-9]{8}$/;

const SAMPLE_FRENCH_DEPARTMENTS: AddressSubdivisionRef[] = [
  { code: '75', name: 'Paris', zone: 'ILE_DE_FRANCE' },
  { code: '69', name: 'Rhône', zone: 'AUVERGNE_RHONE_ALPES' },
  { code: '13', name: 'Bouches-du-Rhône', zone: 'PROVENCE_ALPES_COTE_D_AZUR' },
  { code: '33', name: 'Gironde', zone: 'NOUVELLE_AQUITAINE' },
  { code: '59', name: 'Nord', zone: 'HAUTS_DE_FRANCE' },
  { code: '31', name: 'Haute-Garonne', zone: 'OCCITANIE' },
  { code: '44', name: 'Loire-Atlantique', zone: 'PAYS_DE_LA_LOIRE' },
  { code: '67', name: 'Bas-Rhin', zone: 'GRAND_EST' },
];

export const franceProfile: CountryProfile = {
  code: 'FR',
  name: 'France',
  defaultLocale: 'fr-FR',
  defaultCurrencyCode: 'EUR',
  defaultTimezone: 'Europe/Paris',

  phone: {
    dialCode: '+33',
    regex: FRENCH_PHONE_REGEX,
    formatPlaceholder: '06 12 34 56 78',
    clean: cleanFrenchPhone,
    validate(input: unknown): boolean {
      const cleaned = cleanFrenchPhone(input);
      return FRENCH_PHONE_REGEX.test(cleaned);
    },
  },

  address: {
    subdivisionType: 'DEPARTMENT',
    subdivisionLabel: 'Département',
    subdivisionUnitLabel: 'Ville',
    requiresPostalCode: true,
    postalCodeRegex: /^[0-9]{5}$/,
    getSubdivisions(): AddressSubdivisionRef[] {
      return SAMPLE_FRENCH_DEPARTMENTS;
    },
  },

  fiscal: {
    identifiers: [
      {
        key: 'SIRET',
        label: 'Numéro SIRET (14 chiffres)',
        requiredForB2b: true,
        regex: /^[0-9]{14}$/,
      },
      {
        key: 'TVA_INTRA',
        label: 'TVA Intracommunautaire',
        requiredForB2b: true,
        regex: /^FR[0-9A-Z]{2}[0-9]{9}$/,
      },
    ],
    defaultTaxRatePercent: 20.0,
  },

  commerceRules: {
    codAvailable: false, // COD is generally not offered in French e-commerce
    requiresNationalIdentity: false,
    defaultDeliveryType: 'HOME',
  },
};
