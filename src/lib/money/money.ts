// DRIPIDIN Safe Monetary Primitives & Math Engine
// Implements exact financial calculations, prevents binary floating-point drift,
// and enforces currency isolation boundaries.

import type { Money } from './types';
import { CURRENCY_REGISTRY } from './types';

export function createMoney(amount: number, currency: string = 'DZD'): Money {
  if (!Number.isFinite(amount) || Number.isNaN(amount)) {
    throw new TypeError(`Invalid money amount: "${amount}". Amount must be a finite number.`);
  }
  const cleanCurrency = (currency || 'DZD').trim().toUpperCase();
  return Object.freeze({
    amount,
    currency: cleanCurrency,
  });
}

/**
 * MoneyMath provides financially safe calculations.
 * Internal calculations scale values by 10,000 (4 decimal places) to completely eliminate
 * IEEE-754 binary floating-point accumulation drift (e.g., 0.1 + 0.2 !== 0.3).
 */
export class MoneyMath {
  private static readonly SCALE_FACTOR = 10000;

  /**
   * Add two Money values. Currencies must match.
   */
  static add(a: Money, b: Money): Money {
    this.assertMatchingCurrencies(a, b, 'add');
    const scaledA = Math.round(a.amount * this.SCALE_FACTOR);
    const scaledB = Math.round(b.amount * this.SCALE_FACTOR);
    const result = (scaledA + scaledB) / this.SCALE_FACTOR;
    return createMoney(result, a.currency);
  }

  /**
   * Subtract b from a. Currencies must match.
   */
  static subtract(a: Money, b: Money, allowNegative = false): Money {
    this.assertMatchingCurrencies(a, b, 'subtract');
    const scaledA = Math.round(a.amount * this.SCALE_FACTOR);
    const scaledB = Math.round(b.amount * this.SCALE_FACTOR);
    let result = (scaledA - scaledB) / this.SCALE_FACTOR;
    if (!allowNegative && result < 0) {
      result = 0;
    }
    return createMoney(result, a.currency);
  }

  /**
   * Multiply Money by a numeric factor (e.g., quantity or tax rate).
   */
  static multiply(m: Money, factor: number): Money {
    if (!Number.isFinite(factor) || Number.isNaN(factor)) {
      throw new TypeError(`Invalid multiplication factor: "${factor}". Must be a finite number.`);
    }
    const scaledAmount = Math.round(m.amount * this.SCALE_FACTOR);
    const result = Math.round(scaledAmount * factor) / this.SCALE_FACTOR;
    return createMoney(result, m.currency);
  }

  /**
   * Divide Money by a divisor.
   */
  static divide(m: Money, divisor: number): Money {
    if (!Number.isFinite(divisor) || divisor === 0 || Number.isNaN(divisor)) {
      throw new TypeError(`Invalid divisor: "${divisor}". Must be a non-zero finite number.`);
    }
    const scaledAmount = Math.round(m.amount * this.SCALE_FACTOR);
    const result = Math.round(scaledAmount / divisor) / this.SCALE_FACTOR;
    return createMoney(result, m.currency);
  }

  /**
   * Standard financial half-up rounding to a given decimal precision.
   */
  static round(m: Money, decimals?: number): Money {
    const targetDecimals = decimals ?? (CURRENCY_REGISTRY[m.currency]?.decimals ?? 2);
    const p = Math.pow(10, targetDecimals);
    // Number.EPSILON prevents precision edge cases in IEEE-754 half-way rounding
    const rounded = Math.round((m.amount + Number.EPSILON) * p) / p;
    return createMoney(rounded, m.currency);
  }

  /**
   * Compare two Money values.
   * Returns:
   *   -1 if a < b
   *    0 if a == b
   *    1 if a > b
   */
  static compare(a: Money, b: Money): -1 | 0 | 1 {
    this.assertMatchingCurrencies(a, b, 'compare');
    const scaledA = Math.round(a.amount * this.SCALE_FACTOR);
    const scaledB = Math.round(b.amount * this.SCALE_FACTOR);
    if (scaledA < scaledB) return -1;
    if (scaledA > scaledB) return 1;
    return 0;
  }

  /**
   * Equality check
   */
  static equals(a: Money, b: Money): boolean {
    if (a.currency !== b.currency) return false;
    const scaledA = Math.round(a.amount * this.SCALE_FACTOR);
    const scaledB = Math.round(b.amount * this.SCALE_FACTOR);
    return scaledA === scaledB;
  }

  /**
   * Evenly allocates a Money value across N shares or according to ratios,
   * guaranteeing that the sum of allocated parts exactly equals the total (no lost cent/penny bug).
   */
  static allocate(total: Money, ratios: number[]): Money[] {
    if (ratios.length === 0) return [];
    const sumRatios = ratios.reduce((acc, r) => acc + r, 0);
    if (sumRatios <= 0) {
      throw new Error('Sum of allocation ratios must be greater than zero.');
    }

    const decimals = CURRENCY_REGISTRY[total.currency]?.decimals ?? 2;
    const multiplier = Math.pow(10, decimals);
    const totalMinorUnits = Math.round(total.amount * multiplier);

    let remainder = totalMinorUnits;
    const resultsMinor: number[] = [];

    for (const ratio of ratios) {
      const share = Math.floor((totalMinorUnits * ratio) / sumRatios);
      resultsMinor.push(share);
      remainder -= share;
    }

    // Distribute remainder minor units 1 by 1 to shares with largest ratio
    for (let i = 0; remainder > 0 && i < resultsMinor.length; i++) {
      resultsMinor[i] += 1;
      remainder -= 1;
    }

    return resultsMinor.map(minor => createMoney(minor / multiplier, total.currency));
  }

  /**
   * Factory alias for creating a Money instance.
   */
  static create(amount: number, currency: string = 'DZD'): Money {
    return createMoney(amount, currency);
  }

  /**
   * Creates a zero-value Money instance for the specified currency.
   */
  static zero(currency: string = 'DZD'): Money {
    return createMoney(0, currency);
  }

  /**
   * Sums an array of Money instances.
   */
  static sum(items: Money[], currency?: string): Money {
    if (items.length === 0) {
      return createMoney(0, currency || 'DZD');
    }
    const targetCurrency = currency || items[0].currency;
    return items.reduce((acc, cur) => this.add(acc, cur), createMoney(0, targetCurrency));
  }

  /**
   * Returns the greater of two Money values.
   */
  static max(a: Money, b: Money): Money {
    return this.compare(a, b) >= 0 ? a : b;
  }

  /**
   * Returns true if a > b.
   */
  static greaterThan(a: Money, b: Money): boolean {
    return this.compare(a, b) === 1;
  }

  /**
   * Returns true if a < b.
   */
  static lessThan(a: Money, b: Money): boolean {
    return this.compare(a, b) === -1;
  }

  /**
   * Serializes a Money instance.
   */
  static toJSON(m: Money): { amount: number; currency: string } {
    return { amount: m.amount, currency: m.currency };
  }

  /**
   * Reconstructs a Money instance from JSON.
   */
  static fromJSON(input: string | { amount: number; currency: string }): Money {
    const parsed = typeof input === 'string' ? JSON.parse(input) : input;
    return createMoney(parsed.amount, parsed.currency);
  }

  /**
   * Converts Money to integer minor units (e.g. 10.50 EUR -> 1050 cents; 1000 DZD -> 1000 dinars)
   */
  static toMinorUnits(m: Money): number {
    const decimals = CURRENCY_REGISTRY[m.currency]?.decimals ?? 2;
    return Math.round(m.amount * Math.pow(10, decimals));
  }

  /**
   * Recreates Money from integer minor units
   */
  static fromMinorUnits(minorUnits: number, currency = 'DZD'): Money {
    const decimals = CURRENCY_REGISTRY[currency]?.decimals ?? 2;
    const amount = minorUnits / Math.pow(10, decimals);
    return createMoney(amount, currency);
  }

  private static assertMatchingCurrencies(a: Money, b: Money, operation: string) {
    if (a.currency !== b.currency) {
      throw new Error(
        `Financial currency mismatch in MoneyMath.${operation}: cannot compute between "${a.currency}" and "${b.currency}".`
      );
    }
  }
}
