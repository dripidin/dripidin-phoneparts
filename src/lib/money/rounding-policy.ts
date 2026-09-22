// DRIPIDIN Commercial Rounding Policy Architecture
// Enforces Mandatory Rule 2: Commercial rounding must be an explicit, pluggable policy
// rather than an unconditional hard-coded invariant.

export interface RoundingPolicy {
  readonly id: string;
  readonly name: string;
  apply(amount: number): number;
}

/**
 * Standard exact financial rounding (half-up) to specified decimal places.
 */
export class StandardRoundingPolicy implements RoundingPolicy {
  readonly id = 'STANDARD_EXACT';
  readonly name = 'Arrondi Financier Standard';

  constructor(private readonly decimals: number = 2) {}

  apply(amount: number): number {
    const factor = Math.pow(10, this.decimals);
    return Math.round((amount + Number.EPSILON) * factor) / factor;
  }
}

/**
 * Algerian Commercial Cash Rounding Policy.
 * Rounds to the nearest 10, 50, or 100 DA in cash and COD environments
 * where small coinage is not physically transacted.
 */
export class AlgerianCommercialCashRoundingPolicy implements RoundingPolicy {
  readonly id = 'ALGERIA_CASH_ROUNDING';
  readonly name = 'Arrondi Commercial Espèces (Algérie)';

  constructor(private readonly unit: 10 | 50 | 100 = 10) {}

  apply(amount: number): number {
    if (this.unit <= 0) return Math.round(amount);
    return Math.round(amount / this.unit) * this.unit;
  }
}

/**
 * Factory to resolve the active rounding policy for a given store/country context.
 */
export class RoundingPolicyResolver {
  static resolve(options?: {
    enabled?: boolean;
    unit?: 10 | 50 | 100;
    currencyCode?: string;
    decimals?: number;
  }): RoundingPolicy {
    if (options?.enabled) {
      return new AlgerianCommercialCashRoundingPolicy(options.unit ?? 10);
    }
    const decimals = options?.decimals ?? (options?.currencyCode === 'DZD' ? 0 : 2);
    return new StandardRoundingPolicy(decimals);
  }
}
