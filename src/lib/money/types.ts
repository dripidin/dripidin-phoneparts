// DRIPIDIN Money Domain Types & Currency Metadata
// Authoritative TypeScript interfaces for safe financial representation and formatting.

export interface Money {
  /**
   * Amount in standard decimal currency units (e.g., 18500 for 18,500 DZD, or 49.99 for €49.99).
   */
  readonly amount: number;

  /**
   * ISO 4217 Currency Code (e.g., 'DZD', 'EUR', 'USD', 'GBP').
   */
  readonly currency: string;
}

export type CurrencySymbolPosition = 'BEFORE' | 'AFTER';

export interface CurrencyMetadata {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  symbolPosition: CurrencySymbolPosition;
  spaceSeparated: boolean;
  defaultLocale: string;
}

export interface CurrencyFormatOptions {
  currencyCode?: string;
  currencySymbol?: string;
  decimals?: number;
  position?: CurrencySymbolPosition;
  spaceSeparated?: boolean;
  locale?: string;
}

/**
 * Registry of standard world currencies supported out-of-the-box
 */
export const CURRENCY_REGISTRY: Record<string, CurrencyMetadata> = {
  DZD: {
    code: 'DZD',
    symbol: 'DA',
    name: 'Dinar Algérien',
    decimals: 0,
    symbolPosition: 'AFTER',
    spaceSeparated: true,
    defaultLocale: 'fr-DZ',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    symbolPosition: 'AFTER',
    spaceSeparated: true,
    defaultLocale: 'fr-FR',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    symbolPosition: 'BEFORE',
    spaceSeparated: false,
    defaultLocale: 'en-US',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    symbolPosition: 'BEFORE',
    spaceSeparated: false,
    defaultLocale: 'en-GB',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimals: 0,
    symbolPosition: 'BEFORE',
    spaceSeparated: false,
    defaultLocale: 'ja-JP',
  },
};
