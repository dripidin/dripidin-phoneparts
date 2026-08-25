// HamzaPhone React Query Hook for Deterministic Recommendations

import { useQuery } from '@tanstack/react-query';
import { getProductRecommendationsAction } from '@/lib/actions/recommendations.actions';
import { RecommendationRequestParams } from '@/types/recommendations.types';

export function useProductRecommendations(params: RecommendationRequestParams = {}) {
  return useQuery({
    queryKey: ['recommendations', params],
    queryFn: () => getProductRecommendationsAction(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
