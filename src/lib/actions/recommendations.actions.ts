// HamzaPhone Recommendations Server Action

import { RecommendationService } from '@/lib/recommendations/recommendation.service';
import {
  ProductRecommendation,
  RecommendationRequestParams,
} from '@/types/recommendations.types';

/**
 * Retrieves deterministic product recommendations for PDP, Cart, and Storefront
 */
export async function getProductRecommendationsAction(
  params: RecommendationRequestParams = {}
): Promise<ProductRecommendation[]> {
  return RecommendationService.getRecommendations(params);
}
