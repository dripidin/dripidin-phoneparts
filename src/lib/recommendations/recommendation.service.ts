// HamzaPhone Deterministic Product Recommendations Service
// Explainable, rule-based recommendations leveraging catalog compatibility, order co-occurrence & purchase history

import { adminStore } from '@/lib/admin-store';
import {
  ProductRecommendation,
  PublicProductRecommendationItem,
  RecommendationRequestParams,
} from '@/types/recommendations.types';

export class RecommendationService {
  /**
   * Generates deterministic recommendations based on contextual criteria
   */
  public static getRecommendations(
    params: RecommendationRequestParams = {}
  ): ProductRecommendation[] {
    const limit = params.limit || 4;
    const allProducts = adminStore.getProducts({ pageSize: 4000 }).items;
    const allOrders = adminStore.getOrders();

    const targetProduct = params.productId
      ? allProducts.find((p) => p.id === params.productId)
      : null;

    const recommendations: ProductRecommendation[] = [];
    const addedProductIds = new Set<string>();

    if (params.productId) {
      addedProductIds.add(params.productId);
    }

    // 1. FREQUENTLY BOUGHT TOGETHER (Order Co-occurrence)
    if (params.productId) {
      const coOccurrenceMap = new Map<string, number>();

      allOrders.forEach((order) => {
        if (order.status !== 'CANCELLED') {
          const productIdsInOrder = order.items.map((it) => it.productId);
          if (productIdsInOrder.includes(params.productId!)) {
            productIdsInOrder.forEach((id) => {
              if (id !== params.productId) {
                coOccurrenceMap.set(id, (coOccurrenceMap.get(id) || 0) + 1);
              }
            });
          }
        }
      });

      // Sort by co-occurrence frequency
      const sortedCoOccurred = Array.from(coOccurrenceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      sortedCoOccurred.forEach(([prodId, count]) => {
        const prod = allProducts.find((p) => p.id === prodId && p.status !== 'ARCHIVED');
        if (prod && !addedProductIds.has(prod.id)) {
          addedProductIds.add(prod.id);
          recommendations.push({
            product: this.toPublicSummary(prod),
            reasonFr: 'Fréquemment acheté ensemble lors des réparations',
            reasonAr: 'يتم شراؤها معاً بكثرة في عمليات التصليح',
            score: 95 + count,
            type: 'FREQUENTLY_BOUGHT_TOGETHER',
          });
        }
      });
    }

    // 2. DEVICE COMPATIBILITY MATCHING (Same phone model)
    if (recommendations.length < limit && targetProduct) {
      const targetBrand = targetProduct.brandName;

      const compatibleCandidates = allProducts.filter(
        (p) =>
          p.id !== targetProduct.id &&
          p.status !== 'ARCHIVED' &&
          !addedProductIds.has(p.id) &&
          (p.brandName === targetBrand ||
            (p.compatibility &&
              targetProduct.compatibility &&
              p.compatibility.some((c: any) =>
                targetProduct.compatibility?.some((tc: any) =>
                  tc.modelCode && c.modelCode ? tc.modelCode === c.modelCode : tc === c
                )
              )))
      );

      compatibleCandidates.slice(0, limit - recommendations.length).forEach((prod) => {
        addedProductIds.add(prod.id);
        recommendations.push({
          product: this.toPublicSummary(prod),
          reasonFr: `Pièce compatible pour modèles ${prod.brandName}`,
          reasonAr: `قطعة غيار متوافقة مع أجهزة ${prod.brandName}`,
          score: 85,
          type: 'COMPATIBLE_DEVICES',
        });
      });
    }

    // 3. B2B WHOLESALE REPLENISHMENT RECOMMENDATIONS
    if (params.customerType === 'B2B' && params.userId) {
      // Find past orders specifically for this authenticated B2B workshop
      const userOrders = allOrders.filter(
        (o: any) => o.customerId === params.userId || o.customerPhone === params.userId
      );

      const pastPurchasedProductIds = new Set<string>();
      userOrders.forEach((o) => {
        o.items.forEach((it) => pastPurchasedProductIds.add(it.productId));
      });

      // Recommend fast-moving replacement screens and batteries for workshops
      const b2bCandidates = allProducts.filter(
        (p) =>
          p.status !== 'ARCHIVED' &&
          !addedProductIds.has(p.id) &&
          (p.categoryName?.toLowerCase().includes('écran') ||
            p.categoryName?.toLowerCase().includes('batterie') ||
            pastPurchasedProductIds.has(p.id)) &&
          (p.stockQuantity || 0) >= 5
      );

      b2bCandidates.slice(0, limit - recommendations.length).forEach((prod) => {
        addedProductIds.add(prod.id);
        recommendations.push({
          product: this.toPublicSummary(prod),
          reasonFr: 'Référence recommandée pour réapprovisionnement atelier B2B',
          reasonAr: 'قطعة موصى بها لتزويد ورشات الصيانة بالجملة',
          score: 90,
          type: 'B2B_REPLENISHMENT',
        });
      });
    }

    // 4. POPULAR IN CATEGORY / FALLBACK TOP SELLERS
    if (recommendations.length < limit) {
      const topSellingCandidates = allProducts
        .filter((p) => p.status !== 'ARCHIVED' && !addedProductIds.has(p.id))
        .sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0))
        .slice(0, limit - recommendations.length);

      topSellingCandidates.forEach((prod) => {
        addedProductIds.add(prod.id);
        recommendations.push({
          product: this.toPublicSummary(prod),
          reasonFr: 'Meilleure vente populaire chez HamzaPhone',
          reasonAr: 'الأكثر مبيعاً وشهرة لدى حمزة فون',
          score: 70,
          type: 'POPULAR_IN_CATEGORY',
        });
      });
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Formats internal product model to safe public summary
   */
  private static toPublicSummary(prod: any): PublicProductRecommendationItem {
    return {
      id: prod.id,
      sku: prod.sku,
      slug: prod.slug || prod.sku.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: prod.name,
      brandName: prod.brandName || 'Générique',
      categoryName: prod.categoryName || 'Pièces Détachées',
      primaryImage: prod.imageUrl || prod.images?.[0] || '/images/placeholder-part.png',
      b2cPriceDzd: prod.b2cPriceDzd || 0,
      b2cSalePriceDzd: prod.b2cSalePriceDzd || null,
      b2bBasePriceDzd: prod.b2bBasePriceDzd || null,
      inStock: (prod.stockQuantity || 0) > 0,
      stockQuantity: prod.stockQuantity || 0,
      qualityGrade: prod.qualityGrade || 'ORIGINAL_SERVICE_PACK',
      warrantyMonths: prod.warrantyMonths || 3,
      isFeatured: Boolean(prod.isFeatured),
    };
  }
}
