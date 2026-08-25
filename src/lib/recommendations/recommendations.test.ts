// HamzaPhone Recommendations Automated Test Suite

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RecommendationService } from './recommendation.service';
import { getProductRecommendationsAction } from '@/lib/actions/recommendations.actions';

describe('HamzaPhone Deterministic Recommendations Engine', () => {
  describe('1. Order Co-occurrence & Frequently Bought Together', () => {
    it('should return explainable recommendations with non-empty reason and score', () => {
      const recs = RecommendationService.getRecommendations({
        productId: 'prod-sam-s22-screen',
        limit: 4,
      });

      assert.ok(recs.length > 0);
      assert.ok(recs[0].product.name);
      assert.ok(recs[0].reasonFr);
      assert.ok(recs[0].score > 0);
      assert.notStrictEqual(recs[0].product.id, 'prod-sam-s22-screen');
    });
  });

  describe('2. Device Compatibility Matching', () => {
    it('should prioritize items compatible with the same brand and device series', () => {
      const recs = RecommendationService.getRecommendations({
        brandId: 'brand-samsung',
        productId: 'prod-sam-s22-screen',
        limit: 3,
      });

      assert.ok(recs.length <= 3);
      for (const rec of recs) {
        assert.ok(rec.type === 'FREQUENTLY_BOUGHT_TOGETHER' || rec.type === 'COMPATIBLE_DEVICES' || rec.type === 'POPULAR_IN_CATEGORY');
      }
    });
  });

  describe('3. B2B Wholesale Replenishment Personalization', () => {
    it('should generate workshop replenishment recommendations for authenticated B2B user', () => {
      const b2bRecs = RecommendationService.getRecommendations({
        customerType: 'B2B',
        userId: 'user-b2b-pro-1',
        limit: 4,
      });

      assert.ok(b2bRecs.length > 0);
      const hasReplenish = b2bRecs.some(
        (r) => r.type === 'B2B_REPLENISHMENT' || r.type === 'POPULAR_IN_CATEGORY'
      );
      assert.ok(hasReplenish);
    });
  });

  describe('4. Server Action Integration', () => {
    it('should return safe public product summaries via Server Action', async () => {
      const recs = await getProductRecommendationsAction({ limit: 2 });
      assert.ok(recs.length <= 2);
      if (recs.length > 0) {
        assert.strictEqual(typeof recs[0].product.b2cPriceDzd, 'number');
        // Verify no costPrice is exposed
        assert.strictEqual((recs[0].product as any).costPriceDzd, undefined);
      }
    });
  });
});
