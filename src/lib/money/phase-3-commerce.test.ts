// DRIPIDIN Phase 3: Commerce Settings, Currency & Country Boundary Automated Test Suite
// Verifies financially safe Money arithmetic, currency metadata & formatting,
// commercial rounding policies, country profile contracts (Algeria & France),
// capability resolution, store settings persistence, and domain mapping layer.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MoneyMath,
  MoneyFormatter,
  CURRENCY_REGISTRY,
  createMoney,
  formatCurrency,
  formatMoney,
  StandardRoundingPolicy,
  AlgerianCommercialCashRoundingPolicy,
  RoundingPolicyResolver,
  type Money,
} from './index';
import {
  CountryRegistry,
  algeriaProfile,
  franceProfile,
  type CountryProfile,
} from '@/lib/country';
import { resolveCommerceCapabilities } from '@/lib/capabilities';
import {
  DEFAULT_STORE_SETTINGS,
  mapRowToStoreSettings,
  mapInputToRow,
} from '@/lib/settings/default-settings';

describe('DRIPIDIN Phase 3 — Money & Financial Safety Engine', () => {
  it('prevents floating-point accumulation drift (0.1 + 0.2 === 0.3)', () => {
    const a = MoneyMath.create(0.1, 'EUR');
    const b = MoneyMath.create(0.2, 'EUR');
    const sum = MoneyMath.add(a, b);

    // Floating-point in raw JS: 0.1 + 0.2 === 0.30000000000000004
    assert.strictEqual(sum.amount, 0.3);
    assert.strictEqual(sum.currency, 'EUR');
  });

  it('performs exact addition across multiple monetary values', () => {
    const m1 = MoneyMath.create(1500, 'DZD');
    const m2 = MoneyMath.create(750, 'DZD');
    const m3 = MoneyMath.create(250, 'DZD');

    const total = MoneyMath.sum([m1, m2, m3], 'DZD');
    assert.strictEqual(total.amount, 2500);
    assert.strictEqual(total.currency, 'DZD');
  });

  it('rejects addition of mismatched currencies', () => {
    const dzd = MoneyMath.create(1000, 'DZD');
    const eur = MoneyMath.create(10, 'EUR');

    assert.throws(
      () => MoneyMath.add(dzd, eur),
      /Financial currency mismatch in MoneyMath.add/
    );
  });

  it('performs exact subtraction and prevents negative total when clamped', () => {
    const price = MoneyMath.create(1000, 'DZD');
    const discount = MoneyMath.create(300, 'DZD');
    const result = MoneyMath.subtract(price, discount);

    assert.strictEqual(result.amount, 700);

    const excessiveDiscount = MoneyMath.create(1200, 'DZD');
    const clamped = MoneyMath.subtract(price, excessiveDiscount, false);
    assert.strictEqual(clamped.amount, 0);
  });

  it('performs multiplication by quantity and fractional tax rates safely', () => {
    const unitPrice = MoneyMath.create(33.33, 'EUR');
    const qty = 3;
    const lineTotal = MoneyMath.multiply(unitPrice, qty);

    assert.strictEqual(lineTotal.amount, 99.99);

    // Tax calculation: 19% TVA on 1000 DZD
    const base = MoneyMath.create(1000, 'DZD');
    const tax = MoneyMath.multiply(base, 0.19);
    assert.strictEqual(tax.amount, 190);
  });

  it('correctly compares monetary amounts', () => {
    const a = MoneyMath.create(1500, 'DZD');
    const b = MoneyMath.create(2000, 'DZD');
    const c = MoneyMath.create(1500, 'DZD');

    assert.strictEqual(MoneyMath.compare(a, b), -1);
    assert.strictEqual(MoneyMath.compare(b, a), 1);
    assert.strictEqual(MoneyMath.compare(a, c), 0);
    assert.strictEqual(MoneyMath.equals(a, c), true);
    assert.strictEqual(MoneyMath.greaterThan(b, a), true);
    assert.strictEqual(MoneyMath.lessThan(a, b), true);
  });

  it('converts to and from minor units (cents/centimes) with integer precision', () => {
    // EUR has 2 decimal digits -> minor factor 100
    const eur = MoneyMath.fromMinorUnits(1999, 'EUR');
    assert.strictEqual(eur.amount, 19.99);
    assert.strictEqual(MoneyMath.toMinorUnits(eur), 1999);

    // DZD has 0 decimal digits -> minor factor 1
    const dzd = MoneyMath.fromMinorUnits(1500, 'DZD');
    assert.strictEqual(dzd.amount, 1500);
    assert.strictEqual(MoneyMath.toMinorUnits(dzd), 1500);

    // JPY has 0 decimal digits
    const jpy = MoneyMath.fromMinorUnits(5000, 'JPY');
    assert.strictEqual(jpy.amount, 5000);
    assert.strictEqual(MoneyMath.toMinorUnits(jpy), 5000);
  });

  it('allocates monetary amount pro-rata without losing fractional cents', () => {
    // Split 100.00 EUR across 3 equal partners (33.34 + 33.33 + 33.33)
    const total = MoneyMath.create(100, 'EUR');
    const splits = MoneyMath.allocate(total, [1, 1, 1]);

    assert.strictEqual(splits.length, 3);
    assert.strictEqual(splits[0].amount, 33.34);
    assert.strictEqual(splits[1].amount, 33.33);
    assert.strictEqual(splits[2].amount, 33.33);

    // Verify sum equals exact total
    const reconciled = MoneyMath.sum(splits, 'EUR');
    assert.strictEqual(reconciled.amount, 100);
  });

  it('serializes and deserializes safely', () => {
    const original = MoneyMath.create(4500, 'DZD');
    const json = MoneyMath.toJSON(original);
    const restored = MoneyMath.fromJSON(json);

    assert.strictEqual(restored.amount, 4500);
    assert.strictEqual(restored.currency, 'DZD');
  });
});

describe('DRIPIDIN Phase 3 — Currency Registry & Metadata', () => {
  it('registers supported currencies with correct decimal precision and symbols', () => {
    const dzd = CURRENCY_REGISTRY.DZD;
    assert.strictEqual(dzd.code, 'DZD');
    assert.strictEqual(dzd.symbol, 'DA');
    assert.strictEqual(dzd.decimals, 0);
    assert.strictEqual(dzd.symbolPosition, 'AFTER');

    const eur = CURRENCY_REGISTRY.EUR;
    assert.strictEqual(eur.code, 'EUR');
    assert.strictEqual(eur.symbol, '€');
    assert.strictEqual(eur.decimals, 2);
    assert.strictEqual(eur.symbolPosition, 'AFTER');

    const usd = CURRENCY_REGISTRY.USD;
    assert.strictEqual(usd.code, 'USD');
    assert.strictEqual(usd.symbol, '$');
    assert.strictEqual(usd.decimals, 2);
    assert.strictEqual(usd.symbolPosition, 'BEFORE');
  });
});

describe('DRIPIDIN Phase 3 — MoneyFormatter & Locale Independence', () => {
  it('formats DZD with 0 decimals and trailing symbol by default', () => {
    const formatted = MoneyFormatter.format(1500, { currencyCode: 'DZD' });
    assert.ok(formatted.includes('1'));
    assert.ok(formatted.includes('500'));
    assert.ok(formatted.endsWith('DA'));
  });

  it('formats EUR with 2 decimals and trailing symbol', () => {
    const formatted = MoneyFormatter.format(49.9, { currencyCode: 'EUR' });
    assert.ok(formatted.includes('49,90') || formatted.includes('49.90'));
    assert.ok(formatted.includes('€'));
  });

  it('formats USD with leading symbol and 2 decimals', () => {
    const formatted = MoneyFormatter.format(99.5, { currencyCode: 'USD' });
    assert.ok(formatted.startsWith('$'));
    assert.ok(formatted.includes('99.50'));
  });

  it('respects explicit symbolPosition and spaceSeparated overrides', () => {
    const beforeNoSpace = MoneyFormatter.format(100, {
      currencyCode: 'EUR',
      position: 'BEFORE',
      spaceSeparated: false,
    });
    assert.ok(beforeNoSpace.startsWith('€100'));

    const afterSpaced = MoneyFormatter.format(100, {
      currencyCode: 'USD',
      position: 'AFTER',
      spaceSeparated: true,
    });
    assert.ok(afterSpaced.endsWith(' $'));
  });

  it('allows formatCurrency and formatMoney shorthand calls', () => {
    const shorthand1 = formatCurrency(2500, 'DZD');
    assert.ok(shorthand1.includes('2'));
    assert.ok(shorthand1.includes('500'));
    assert.ok(shorthand1.includes('DA'));

    const moneyObj = MoneyMath.create(75, 'EUR');
    const shorthand2 = formatMoney(moneyObj);
    assert.ok(shorthand2.includes('75,00') || shorthand2.includes('75.00'));
    assert.ok(shorthand2.includes('€'));
  });
});

describe('DRIPIDIN Phase 3 — Commercial Rounding Policy', () => {
  it('StandardRoundingPolicy rounds half-up to currency precision', () => {
    const policy = new StandardRoundingPolicy(0);
    assert.strictEqual(policy.apply(1500.4), 1500);

    const eurPolicy = new StandardRoundingPolicy(2);
    assert.strictEqual(eurPolicy.apply(19.996), 20.0);
  });

  it('AlgerianCommercialCashRoundingPolicy rounds cash amounts to nearest 10 DA', () => {
    const policy = new AlgerianCommercialCashRoundingPolicy(10);

    assert.strictEqual(policy.apply(1504), 1500);
    assert.strictEqual(policy.apply(1505), 1510);
    assert.strictEqual(policy.apply(1508), 1510);
  });

  it('RoundingPolicyResolver selects appropriate policy based on store settings', () => {
    const standardResolver = RoundingPolicyResolver.resolve({
      enabled: false,
    });
    assert.strictEqual(standardResolver.id, 'STANDARD_EXACT');

    const algerianResolver = RoundingPolicyResolver.resolve({
      enabled: true,
      unit: 10,
    });
    assert.strictEqual(algerianResolver.id, 'ALGERIA_CASH_ROUNDING');
  });
});

describe('DRIPIDIN Phase 3 — Country Profile Contract & Registry', () => {
  it('resolves Algeria (DZ) profile with 58 Wilayas contract and COD enabled', () => {
    const profile = CountryRegistry.get('DZ');
    assert.strictEqual(profile.code, 'DZ');
    assert.strictEqual(profile.name, 'Algérie');
    assert.strictEqual(profile.defaultCurrencyCode, 'DZD');
    assert.strictEqual(profile.defaultLocale, 'fr-DZ');
    assert.strictEqual(profile.phone.dialCode, '+213');
    assert.strictEqual(profile.address.subdivisionType, 'WILAYA');
    assert.strictEqual(profile.address.getSubdivisions().length, 58);
    assert.strictEqual(profile.commerceRules.codAvailable, true);
    assert.strictEqual(profile.fiscal.identifiers.length, 4); // RC, NIF, NIS, ARTICLE_IMPOSITION
  });

  it('validates and cleans Algerian phone numbers correctly', () => {
    const phoneSpec = algeriaProfile.phone;

    assert.strictEqual(phoneSpec.validate('0550123456'), true);
    assert.strictEqual(phoneSpec.validate('0661123456'), true);
    assert.strictEqual(phoneSpec.validate('0770123456'), true);
    assert.strictEqual(phoneSpec.validate('+213550123456'), true);
    assert.strictEqual(phoneSpec.validate('021123456'), false); // Landline not mobile
    assert.strictEqual(phoneSpec.validate('12345'), false);

    // Cleaning: converts international +213 format to national 05/06/07
    assert.strictEqual(phoneSpec.clean('+213550123456'), '0550123456');
    assert.strictEqual(phoneSpec.clean('05 50 12 34 56'), '0550123456');
  });

  it('resolves France (FR) architectural reference profile without breaking Algeria', () => {
    const profile = CountryRegistry.get('FR');
    assert.strictEqual(profile.code, 'FR');
    assert.strictEqual(profile.name, 'France');
    assert.strictEqual(profile.defaultCurrencyCode, 'EUR');
    assert.strictEqual(profile.defaultLocale, 'fr-FR');
    assert.strictEqual(profile.phone.dialCode, '+33');
    assert.strictEqual(profile.address.subdivisionType, 'DEPARTMENT');
    assert.strictEqual(profile.commerceRules.codAvailable, false);
    assert.strictEqual(profile.fiscal.identifiers[0].key, 'SIRET');

    // Phone validation for French mobile
    assert.strictEqual(profile.phone.validate('0612345678'), true);
    assert.strictEqual(profile.phone.validate('0712345678'), true);
    assert.strictEqual(profile.phone.validate('+213550123456'), false);
    assert.strictEqual(profile.phone.validate('01234'), false);
  });

  it('falls back deterministically to Algeria for unknown country codes', () => {
    const fallback = CountryRegistry.get('ZZ');
    assert.strictEqual(fallback.code, 'DZ');
  });
});

describe('DRIPIDIN Phase 3 — Commerce Capabilities Architecture', () => {
  it('resolves deterministic capabilities for store settings in Algeria', () => {
    const caps = resolveCommerceCapabilities({
      enableB2bWholesale: true,
      enableProductReviews: true,
      enableCashOnDelivery: true,
      enableCommercialRounding: true,
    }, algeriaProfile);

    assert.strictEqual(caps.b2bWholesale, true);
    assert.strictEqual(caps.deviceCompatibility, true);
    assert.strictEqual(caps.productReviews, true);
    assert.strictEqual(caps.cashOnDelivery, true);
    assert.strictEqual(caps.commercialCashRounding, true);
  });

  it('strictly blocks COD when country profile disallows it even if store enables it (Rule 10)', () => {
    const caps = resolveCommerceCapabilities({
      enableCashOnDelivery: true,
    }, franceProfile);

    // France country profile has codAvailable: false
    assert.strictEqual(caps.cashOnDelivery, false);
  });

  it('allows store settings to disable capabilities independently', () => {
    const caps = resolveCommerceCapabilities({
      enableB2bWholesale: false,
      enableProductReviews: false,
      enableCashOnDelivery: false,
    }, algeriaProfile);

    assert.strictEqual(caps.b2bWholesale, false);
    assert.strictEqual(caps.productReviews, false);
    assert.strictEqual(caps.cashOnDelivery, false);
  });
});

describe('DRIPIDIN Phase 3 — Store Settings & Domain Mapping', () => {
  it('provides complete defaults for currency, commercial rounding, and order prefix', () => {
    assert.strictEqual(DEFAULT_STORE_SETTINGS.currencyCode, 'DZD');
    assert.strictEqual(DEFAULT_STORE_SETTINGS.currencySymbol, 'DA');
    assert.strictEqual(DEFAULT_STORE_SETTINGS.currencyDecimals, 0);
    assert.strictEqual(DEFAULT_STORE_SETTINGS.currencyPosition, 'AFTER');
    assert.strictEqual(DEFAULT_STORE_SETTINGS.orderPrefix, 'DRP');
    assert.strictEqual(DEFAULT_STORE_SETTINGS.enableCashOnDelivery, true);
    assert.strictEqual(DEFAULT_STORE_SETTINGS.enableCommercialRounding, false);
    assert.strictEqual(DEFAULT_STORE_SETTINGS.commercialRoundingUnit, 10);
  });

  it('maps raw PostgreSQL columns to typed StoreSettings correctly', () => {
    const mockRow = {
      id: 'default',
      store_name: 'TEST STORE',
      currency_code: 'EUR',
      currency_symbol: '€',
      currency_decimals: 2,
      currency_position: 'AFTER',
      currency_space_separated: true,
      order_prefix: 'ORD',
      prices_include_tax: true,
      enable_cash_on_delivery: false,
      enable_commercial_rounding: false,
      commercial_rounding_unit: 1,
      free_shipping_threshold_dzd: 25000,
      version: 1,
      updated_at: new Date().toISOString(),
    };

    const parsed = mapRowToStoreSettings(mockRow);
    assert.strictEqual(parsed.currencyCode, 'EUR');
    assert.strictEqual(parsed.currencySymbol, '€');
    assert.strictEqual(parsed.currencyDecimals, 2);
    assert.strictEqual(parsed.orderPrefix, 'ORD');
    assert.strictEqual(parsed.enableCashOnDelivery, false);
    assert.strictEqual(parsed.freeShippingThresholdDzd, 25000);
  });

  it('maps user input correctly to database row columns for updates', () => {
    const input = {
      currencyCode: 'USD',
      currencySymbol: '$',
      currencyDecimals: 2,
      currencyPosition: 'BEFORE' as const,
      orderPrefix: 'US',
      enableCashOnDelivery: false,
    };

    const row = mapInputToRow(input);
    assert.strictEqual(row.currency_code, 'USD');
    assert.strictEqual(row.currency_symbol, '$');
    assert.strictEqual(row.currency_decimals, 2);
    assert.strictEqual(row.currency_position, 'BEFORE');
    assert.strictEqual(row.order_prefix, 'US');
    assert.strictEqual(row.enable_cash_on_delivery, false);
  });

  it('maps physical _dzd database columns to currency-neutral domain Money values', () => {
    // Simulating repository mapping of order row with *_dzd columns
    const dbOrderRow = {
      id: 'ord_123',
      order_number: 'DRP-2026-0001',
      subtotal_dzd: 15000,
      shipping_cost_dzd: 600,
      discount_amount_dzd: 1000,
      total_dzd: 14600,
      currency_code: 'DZD',
    };

    // Domain mapper function
    const toDomainOrder = (row: typeof dbOrderRow) => {
      const currency = row.currency_code || 'DZD';
      return {
        id: row.id,
        orderNumber: row.order_number,
        subtotal: MoneyMath.create(row.subtotal_dzd, currency),
        shippingCost: MoneyMath.create(row.shipping_cost_dzd, currency),
        discount: MoneyMath.create(row.discount_amount_dzd, currency),
        total: MoneyMath.create(row.total_dzd, currency),
      };
    };

    const domainOrder = toDomainOrder(dbOrderRow);
    assert.strictEqual(domainOrder.subtotal.amount, 15000);
    assert.strictEqual(domainOrder.subtotal.currency, 'DZD');
    assert.strictEqual(domainOrder.shippingCost.amount, 600);
    assert.strictEqual(domainOrder.total.amount, 14600);

    // Verify arithmetic consistency using MoneyMath
    const calculatedTotal = MoneyMath.subtract(
      MoneyMath.add(domainOrder.subtotal, domainOrder.shippingCost),
      domainOrder.discount
    );
    assert.strictEqual(calculatedTotal.amount, domainOrder.total.amount);
  });
});
