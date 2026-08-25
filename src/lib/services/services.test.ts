// Comprehensive Test Suite for HamzaPhone Domain Services

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PricingService } from './pricing.service';
import { OrderService, ALLOWED_ORDER_TRANSITIONS } from './order.service';
import { SearchService } from './search.service';

describe('PricingService & Price Resolution Matrix', () => {
  const sampleProduct = {
    cost_price_dzd: 8000,
    b2c_price_dzd: 14500,
    b2c_sale_price_dzd: 12500,
    b2b_price_dzd: 11000,
  };

  const sampleTierPrices = [
    { tier_id: 'tier-silver', price_dzd: 10500, min_quantity: 1 },
    { tier_id: 'tier-silver', price_dzd: 9800, min_quantity: 10 },
  ];

  it('Level 5: should resolve to consumer sale price if available for unauthenticated user', () => {
    const result = PricingService.resolvePrice(sampleProduct, [], null, { quantity: 1 });
    assert.equal(result.unitPriceDzd, 12500);
    assert.equal(result.pricingTierApplied, 'B2C_SALE');
  });

  it('Level 5: should resolve to standard b2c retail if no promo sale is active', () => {
    const noSaleProduct = { ...sampleProduct, b2c_sale_price_dzd: null };
    const result = PricingService.resolvePrice(noSaleProduct, [], null, { quantity: 1 });
    assert.equal(result.unitPriceDzd, 14500);
    assert.equal(result.pricingTierApplied, 'B2C_RETAIL');
  });

  it('Level 4: should resolve to base B2B price when user has B2B context but no tier overrides', () => {
    const result = PricingService.resolvePrice(sampleProduct, [], null, {
      businessId: 'biz-123',
      quantity: 1,
    });
    assert.equal(result.unitPriceDzd, 11000);
    assert.equal(result.pricingTierApplied, 'B2B_BASE');
  });

  it('Level 3: should resolve to B2B Tier price when tier override is present', () => {
    const result = PricingService.resolvePrice(sampleProduct, sampleTierPrices, null, {
      tierCode: 'TIER_SILVER',
      quantity: 1,
    });
    assert.equal(result.unitPriceDzd, 10500);
    assert.equal(result.pricingTierApplied, 'B2B_TIER');
  });

  it('Level 2: should resolve to Volume Break discount when quantity threshold is met', () => {
    const result = PricingService.resolvePrice(sampleProduct, sampleTierPrices, null, {
      tierCode: 'TIER_SILVER',
      quantity: 10,
    });
    assert.equal(result.unitPriceDzd, 9800);
    assert.equal(result.pricingTierApplied, 'VOLUME_BREAK');
  });

  it('Level 1: should resolve to Custom Contract price as highest priority override', () => {
    const contract = {
      custom_price_dzd: 9200,
      valid_until: new Date(Date.now() + 86400000).toISOString(),
    };
    const result = PricingService.resolvePrice(sampleProduct, sampleTierPrices, contract, {
      tierCode: 'TIER_SILVER',
      quantity: 10,
    });
    assert.equal(result.unitPriceDzd, 9200);
    assert.equal(result.pricingTierApplied, 'CUSTOM_CONTRACT');
  });

  it('should round DZD amounts accurately to the nearest 10 or 50 DZD', () => {
    assert.equal(PricingService.roundDzd(14523, 10), 14520);
    assert.equal(PricingService.roundDzd(14528, 10), 14530);
    assert.equal(PricingService.roundDzd(14523, 50), 14500);
    assert.equal(PricingService.roundDzd(14538, 50), 14550);
  });

  it('should generate bulk adjustment preview and detect items breaching cost margin guard', () => {
    const products = [
      { id: '1', sku: 'HP-SCR-1', name: 'Screen A', cost_price_dzd: 10000, b2c_price_dzd: 12000, b2b_price_dzd: 11000 },
      { id: '2', sku: 'HP-SCR-2', name: 'Screen B', cost_price_dzd: 8000, b2c_price_dzd: 15000, b2b_price_dzd: 13000 },
    ];

    const preview = PricingService.previewBulkAdjustment(products, {
      scope: 'ALL',
      targetField: 'BOTH',
      percentageChange: -15, // -15% reduction
      roundingUnitDzd: 10,
    }, 5.0);

    assert.equal(preview.length, 2);
    // Screen A: 11000 * 0.85 = 9350 DZD (Below cost 10000 DZD!)
    assert.equal(preview[0].newB2bPriceDzd, 9350);
    assert.equal(preview[0].isBelowCostWarning, true);

    // Screen B: 13000 * 0.85 = 11050 DZD (Cost is 8000 DZD -> Margin is ~27% -> OK)
    assert.equal(preview[1].newB2bPriceDzd, 11050);
    assert.equal(preview[1].isBelowCostWarning, false);
  });
});

describe('OrderService & State Machine Transitions', () => {
  it('should validate all standard forward transitions in order fulfillment lifecycle', () => {
    assert.equal(OrderService.isValidTransition('PENDING', 'CONFIRMED'), true);
    assert.equal(OrderService.isValidTransition('CONFIRMED', 'PROCESSING'), true);
    assert.equal(OrderService.isValidTransition('PROCESSING', 'READY_FOR_SHIPMENT'), true);
    assert.equal(OrderService.isValidTransition('READY_FOR_SHIPMENT', 'SHIPPED'), true);
    assert.equal(OrderService.isValidTransition('SHIPPED', 'DELIVERED'), true);
  });

  it('should allow valid cancellation paths before dispatch', () => {
    assert.equal(OrderService.isValidTransition('PENDING', 'CANCELLED'), true);
    assert.equal(OrderService.isValidTransition('CONFIRMED', 'CANCELLED'), true);
    assert.equal(OrderService.isValidTransition('PROCESSING', 'CANCELLED'), true);
    assert.equal(OrderService.isValidTransition('READY_FOR_SHIPMENT', 'CANCELLED'), true);
  });

  it('should reject invalid transitions (skipping mandatory steps)', () => {
    assert.equal(OrderService.isValidTransition('PENDING', 'DELIVERED'), false);
    assert.equal(OrderService.isValidTransition('PENDING', 'SHIPPED'), false);
    assert.equal(OrderService.isValidTransition('DELIVERED', 'CANCELLED'), false);
    assert.equal(OrderService.isValidTransition('CANCELLED', 'SHIPPED'), false);
  });
});

describe('SearchService Query Sanitization', () => {
  it('should sanitize technical part codes and preserve Arabic strings safely', () => {
    assert.equal(SearchService.sanitizeQuery('Samsung S21: (SM-G998B)'), 'Samsung S21 SM-G998B');
    assert.equal(SearchService.sanitizeQuery('شاشة سامسونج S22 Ultra'), 'شاشة سامسونج S22 Ultra');
    assert.equal(SearchService.sanitizeQuery('HP-SCR-SAM-01; DROP TABLE products;'), 'HP-SCR-SAM-01 DROP TABLE products');
  });
});
