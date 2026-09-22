// DRIPIDIN Centralized Money Formatter
// Formats financial values with locale-aware grouping, custom symbol positioning,
// and strict separation of presentation from monetary calculation.

import type { Money, CurrencyFormatOptions } from './types';
import { CURRENCY_REGISTRY } from './types';

export class MoneyFormatter {
  /**
   * Authoritative money formatter.
   */
  static format(
    amountOrMoney: number | Money,
    options: CurrencyFormatOptions = {}
  ): string {
    let amount: number;
    let explicitCurrency = options.currencyCode;

    if (typeof amountOrMoney === 'object' && amountOrMoney !== null) {
      amount = amountOrMoney.amount;
      if (!explicitCurrency) {
        explicitCurrency = amountOrMoney.currency;
      }
    } else {
      amount = typeof amountOrMoney === 'number' && Number.isFinite(amountOrMoney) ? amountOrMoney : 0;
    }

    const currencyCode = (explicitCurrency || 'DZD').trim().toUpperCase();
    const meta = CURRENCY_REGISTRY[currencyCode];

    const currencySymbol = options.currencySymbol ?? (meta ? meta.symbol : currencyCode === 'DZD' ? 'DA' : currencyCode);
    const decimals = options.decimals ?? (meta ? meta.decimals : currencyCode === 'DZD' ? 0 : 2);
    const position = options.position ?? (meta ? meta.symbolPosition : 'AFTER');
    const spaceSeparated = options.spaceSeparated ?? (meta ? meta.spaceSeparated : true);
    const locale = options.locale ?? (meta ? meta.defaultLocale : 'fr-DZ');

    // 1. Format numeric portion with locale thousands and decimal separators
    let formattedNumber: string;
    try {
      formattedNumber = new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(amount);
    } catch {
      // Fallback in case of an unusual or invalid locale string
      formattedNumber = amount.toLocaleString('fr-DZ', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }

    // 2. Assemble currency symbol with placement and spacing
    const space = spaceSeparated ? ' ' : '';
    if (position === 'BEFORE') {
      return `${currencySymbol}${space}${formattedNumber}`;
    }
    return `${formattedNumber}${space}${currencySymbol}`;
  }
}

/**
 * Convenience helper for generic currency formatting
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'DZD',
  locale?: string
): string {
  return MoneyFormatter.format(amount, { currencyCode, locale });
}

/**
 * Convenience helper for Money object formatting
 */
export function formatMoney(money: Money, options?: CurrencyFormatOptions): string {
  return MoneyFormatter.format(money, options);
}
