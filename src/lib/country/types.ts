// DRIPIDIN Country Profile Domain Types & Contract
// Enforces Mandatory Rule 3: CountryProfile defines regional contracts without
// embedding operational database tables directly into static memory.

export type AddressSubdivisionType = 'WILAYA' | 'DEPARTMENT' | 'PROVINCE' | 'STATE';

export interface AddressSubdivisionRef {
  code: number | string;
  name: string;
  nameNative?: string;
  zone?: string;
}

export interface FiscalIdentifierSpec {
  key: string;
  label: string;
  requiredForB2b: boolean;
  formatDescription?: string;
  regex?: RegExp;
}

export interface CountryProfile {
  readonly code: string; // ISO 3166-1 alpha-2 (e.g., 'DZ', 'FR')
  readonly name: string;
  readonly defaultLocale: string;
  readonly defaultCurrencyCode: string;
  readonly defaultTimezone: string;

  readonly phone: {
    readonly dialCode: string;
    readonly regex: RegExp;
    readonly formatPlaceholder: string;
    clean(input: unknown): string;
    validate(input: unknown): boolean;
  };

  readonly address: {
    readonly subdivisionType: AddressSubdivisionType;
    readonly subdivisionLabel: string; // e.g. 'Wilaya', 'Département'
    readonly subdivisionUnitLabel: string; // e.g. 'Commune', 'Ville'
    readonly requiresPostalCode: boolean;
    readonly postalCodeRegex?: RegExp;
    getSubdivisions(): AddressSubdivisionRef[];
  };

  readonly fiscal: {
    readonly identifiers: FiscalIdentifierSpec[];
    readonly defaultTaxRatePercent: number;
  };

  readonly commerceRules: {
    readonly codAvailable: boolean;
    readonly requiresNationalIdentity: boolean;
    readonly defaultDeliveryType: 'HOME' | 'DESK';
  };
}
