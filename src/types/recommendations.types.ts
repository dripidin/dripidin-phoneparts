// HamzaPhone Deterministic Product Recommendations Domain Types

export type RecommendationType =
  | 'RELATED'
  | 'FREQUENTLY_BOUGHT_TOGETHER'
  | 'POPULAR_IN_CATEGORY'
  | 'COMPATIBLE_DEVICES'
  | 'RECENTLY_VIEWED'
  | 'B2B_REPLENISHMENT';

export interface PublicProductRecommendationItem {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brandName: string;
  categoryName: string;
  primaryImage: string;
  b2cPriceDzd: number;
  b2cSalePriceDzd: number | null;
  b2bBasePriceDzd: number | null;
  inStock: boolean;
  stockQuantity: number;
  qualityGrade: string;
  warrantyMonths: number;
  isFeatured: boolean;
}

export interface ProductRecommendation {
  product: PublicProductRecommendationItem;
  reasonFr: string;
  reasonAr?: string;
  score: number;
  type: RecommendationType;
}

export interface RecommendationRequestParams {
  productId?: string;
  deviceModelId?: string;
  categoryId?: string;
  brandId?: string;
  limit?: number;
  customerType?: 'B2C' | 'B2B';
  userId?: string;
  recentlyViewedProductIds?: string[];
}
