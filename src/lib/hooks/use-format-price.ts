'use client';

// DRIPIDIN Dynamic Price Formatting Hook
// Connects UI components to the persistent StoreSettings currency layer,
// eliminating ad-hoc string concatenation and hard-coded 'DZD' / 'DA' literals.

import { useCallback } from 'react';
import { useWebsiteSettings } from '@/lib/hooks/use-settings-cms';
import { MoneyFormatter } from '@/lib/money/formatter';
import type { Money, CurrencyFormatOptions } from '@/lib/money/types';
import type { StoreSettings } from '@/types/settings.types';

export function useFormatPrice() {
  const { data: settings } = useWebsiteSettings();

  const formatPrice = useCallback(
    (amountOrMoney: number | Money, overrideOptions?: CurrencyFormatOptions) => {
      return MoneyFormatter.format(amountOrMoney, {
        currencyCode: overrideOptions?.currencyCode ?? settings?.currencyCode,
        currencySymbol: overrideOptions?.currencySymbol ?? settings?.currencySymbol,
        decimals: overrideOptions?.decimals ?? settings?.currencyDecimals,
        position: overrideOptions?.position ?? settings?.currencyPosition,
        spaceSeparated: overrideOptions?.spaceSeparated ?? settings?.currencySpaceSeparated,
        locale: overrideOptions?.locale ?? settings?.defaultLocale,
      });
    },
    [
      settings?.currencyCode,
      settings?.currencySymbol,
      settings?.currencyDecimals,
      settings?.currencyPosition,
      settings?.currencySpaceSeparated,
      settings?.defaultLocale,
    ]
  );

  return {
    formatPrice,
    currencyCode: settings?.currencyCode || 'DZD',
    currencySymbol: settings?.currencySymbol || 'DA',
    currencyDecimals: settings?.currencyDecimals ?? 0,
    settings,
  };
}

/**
 * Server-safe price formatter for Server Components, SSR metadata, and background processes.
 */
export function formatPriceWithSettings(
  amountOrMoney: number | Money,
  settings?: Partial<StoreSettings> | null,
  overrideOptions?: CurrencyFormatOptions
): string {
  return MoneyFormatter.format(amountOrMoney, {
    currencyCode: overrideOptions?.currencyCode ?? settings?.currencyCode,
    currencySymbol: overrideOptions?.currencySymbol ?? settings?.currencySymbol,
    decimals: overrideOptions?.decimals ?? settings?.currencyDecimals,
    position: overrideOptions?.position ?? settings?.currencyPosition,
    spaceSeparated: overrideOptions?.spaceSeparated ?? settings?.currencySpaceSeparated,
    locale: overrideOptions?.locale ?? settings?.defaultLocale,
  });
}
