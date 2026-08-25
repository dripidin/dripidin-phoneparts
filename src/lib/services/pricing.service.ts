// HamzaPhone Pricing Engine: 5-Level Price Resolution, DZD Rounding, Margin Guard & Bulk Operations

import type { Database } from '@/types/database.types';
import type { 
  PriceResolutionContext, 
  ResolvedPrice, 
  BulkPriceAdjustmentInput, 
  BulkPricePreviewItem 
} from '@/types/domain.types';

export class PricingService {
  /**
   * Round DZD amounts to the nearest 10, 50, or 100 DZD according to Algerian commercial practice
   */
  static roundDzd(amount: number, roundingUnit: 10 | 50 | 100 = 10): number {
    return Math.round(amount / roundingUnit) * roundingUnit;
  }

  /**
   * Calculate gross margin percentage: ((Selling - Cost) / Selling) * 100
   */
  static calculateMargin(sellingPrice: number, costPrice: number): number {
    if (sellingPrice <= 0) return 0;
    return Number((((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(2));
  }

  /**
   * Deterministic 5-Level Price Resolution:
   * Level 1: Customer-Specific Contract Price
   * Level 2: Volume Break Discount for Tier
   * Level 3: B2B Tier Price
   * Level 4: Standard B2B Base Price
   * Level 5: Standard B2C / B2C Sale Price
   */
  static resolvePrice(
    product: {
      cost_price_dzd: number;
      b2c_price_dzd: number;
      b2c_sale_price_dzd?: number | null;
      b2b_price_dzd: number;
    },
    tierPrices: Array<{ tier_id: string; price_dzd: number; min_quantity: number }> = [],
    customContractPrice?: { custom_price_dzd: number; valid_until?: string | null } | null,
    context: PriceResolutionContext = { quantity: 1 }
  ): ResolvedPrice {
    const qty = Math.max(1, context.quantity);
    const standardRetail = product.b2c_sale_price_dzd ?? product.b2c_price_dzd;

    // Level 1: Customer-Specific Contract Price
    if (customContractPrice) {
      const isValid = !customContractPrice.valid_until || new Date(customContractPrice.valid_until) > new Date();
      if (isValid) {
        const unitPrice = customContractPrice.custom_price_dzd;
        return {
          unitPriceDzd: unitPrice,
          originalPriceDzd: product.b2c_price_dzd,
          discountPercentage: Number((((product.b2c_price_dzd - unitPrice) / product.b2c_price_dzd) * 100).toFixed(2)),
          pricingTierApplied: 'CUSTOM_CONTRACT',
          savingsDzd: (product.b2c_price_dzd - unitPrice) * qty,
        };
      }
    }

    // If user has B2B context
    if (context.tierCode || context.businessId) {
      // Level 2: Volume Break
      const matchingVolumeBreaks = tierPrices
        .filter(tp => qty >= tp.min_quantity)
        .sort((a, b) => b.min_quantity - a.min_quantity);

      if (matchingVolumeBreaks.length > 0 && matchingVolumeBreaks[0].min_quantity > 1) {
        const unitPrice = matchingVolumeBreaks[0].price_dzd;
        return {
          unitPriceDzd: unitPrice,
          originalPriceDzd: product.b2c_price_dzd,
          discountPercentage: Number((((product.b2c_price_dzd - unitPrice) / product.b2c_price_dzd) * 100).toFixed(2)),
          pricingTierApplied: 'VOLUME_BREAK',
          savingsDzd: (product.b2c_price_dzd - unitPrice) * qty,
        };
      }

      // Level 3: B2B Tier Price (min_quantity = 1)
      const baseTierPrice = tierPrices.find(tp => tp.min_quantity === 1);
      if (baseTierPrice) {
        const unitPrice = baseTierPrice.price_dzd;
        return {
          unitPriceDzd: unitPrice,
          originalPriceDzd: product.b2c_price_dzd,
          discountPercentage: Number((((product.b2c_price_dzd - unitPrice) / product.b2c_price_dzd) * 100).toFixed(2)),
          pricingTierApplied: 'B2B_TIER',
          savingsDzd: (product.b2c_price_dzd - unitPrice) * qty,
        };
      }

      // Level 4: Standard B2B Base Price
      const unitPrice = product.b2b_price_dzd;
      return {
        unitPriceDzd: unitPrice,
        originalPriceDzd: product.b2c_price_dzd,
        discountPercentage: Number((((product.b2c_price_dzd - unitPrice) / product.b2c_price_dzd) * 100).toFixed(2)),
        pricingTierApplied: 'B2B_BASE',
        savingsDzd: (product.b2c_price_dzd - unitPrice) * qty,
      };
    }

    // Level 5: Consumer Retail (Sale or Standard)
    const isSale = product.b2c_sale_price_dzd !== null && product.b2c_sale_price_dzd !== undefined;
    const unitPrice = standardRetail;

    return {
      unitPriceDzd: unitPrice,
      originalPriceDzd: product.b2c_price_dzd,
      discountPercentage: isSale 
        ? Number((((product.b2c_price_dzd - unitPrice) / product.b2c_price_dzd) * 100).toFixed(2))
        : 0,
      pricingTierApplied: isSale ? 'B2C_SALE' : 'B2C_RETAIL',
      savingsDzd: (product.b2c_price_dzd - unitPrice) * qty,
    };
  }

  /**
   * Preview bulk percentage adjustment across products with minimum margin guard validation
   */
  static previewBulkAdjustment(
    products: Array<{
      id: string;
      sku: string;
      name: string;
      cost_price_dzd: number;
      b2c_price_dzd: number;
      b2b_price_dzd: number;
    }>,
    input: BulkPriceAdjustmentInput,
    minMarginPercentage: number = 5.0 // Minimum 5% profit margin default
  ): BulkPricePreviewItem[] {
    const factor = 1 + (input.percentageChange / 100);

    return products.map(product => {
      let newB2c = product.b2c_price_dzd;
      let newB2b = product.b2b_price_dzd;

      if (input.targetField === 'B2C_PRICE' || input.targetField === 'BOTH') {
        newB2c = PricingService.roundDzd(product.b2c_price_dzd * factor, input.roundingUnitDzd);
      }

      if (input.targetField === 'B2B_PRICE' || input.targetField === 'BOTH') {
        newB2b = PricingService.roundDzd(product.b2b_price_dzd * factor, input.roundingUnitDzd);
      }

      const effectiveSelling = Math.min(newB2c, newB2b);
      const margin = PricingService.calculateMargin(effectiveSelling, product.cost_price_dzd);
      const isBelowCostWarning = margin < minMarginPercentage;

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        costPriceDzd: product.cost_price_dzd,
        oldB2cPriceDzd: product.b2c_price_dzd,
        newB2cPriceDzd: newB2c,
        oldB2bPriceDzd: product.b2b_price_dzd,
        newB2bPriceDzd: newB2b,
        marginPercentage: margin,
        isBelowCostWarning,
      };
    });
  }
}
