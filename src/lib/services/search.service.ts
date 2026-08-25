// HamzaPhone Search Service: Instant Sub-50ms Discovery, Facet Filtering, Trigram & FTS Query Sanitization

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProductType } from '@/types/database.types';

export interface InstantSearchResult {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  slug: string;
  mainImage: string;
  productType: ProductType;
  b2cPriceDzd: number;
  b2cSalePriceDzd: number | null;
  availableStock: number;
  relevanceScore: number;
}

export class SearchService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Sanitize raw search string to prevent SQL and TSQuery parsing crashes (e.g. hyphens, colons, quotes)
   */
  static sanitizeQuery(rawQuery: string): string {
    if (!rawQuery) return '';
    return rawQuery
      .trim()
      .replace(/--+/g, ' ')
      .replace(/[^\w\s\u0600-\u06FF-]/gi, ' ') // Preserve Arabic characters, alphanumerics and hyphens
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Execute high-speed instant search RPC with fuzzy fallback
   */
  async instantSearch(
    query: string,
    brandId?: string | null,
    categoryId?: string | null,
    maxResults: number = 8
  ): Promise<InstantSearchResult[]> {
    const cleaned = SearchService.sanitizeQuery(query);
    if (!cleaned || cleaned.length < 2) return [];

    const { data, error } = await (this.supabase.rpc as any)('search_products_instant', {
      search_query: cleaned,
      filter_brand_id: brandId || null,
      filter_category_id: categoryId || null,
      max_results: maxResults,
    });

    if (error) {
      // Fallback query if RPC encounters unexpected character
      const { data: fallbackData, error: fallbackError } = await (this.supabase
        .from('products') as any)
        .select('id, sku, barcode, name, slug, main_image, product_type, b2c_price_dzd, b2c_sale_price_dzd, available_stock')
        .eq('status', 'ACTIVE')
        .eq('is_visible', true)
        .or(`sku.ilike.%${cleaned}%,name.ilike.%${cleaned}%,barcode.eq.${cleaned}`)
        .limit(maxResults);

      if (fallbackError) {
        throw new Error(`Search failed: ${fallbackError.message}`);
      }

      return (fallbackData || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        slug: p.slug,
        mainImage: p.main_image,
        productType: p.product_type,
        b2cPriceDzd: p.b2c_price_dzd,
        b2cSalePriceDzd: p.b2c_sale_price_dzd,
        availableStock: p.available_stock,
        relevanceScore: 10.0,
      }));
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      sku: item.sku,
      barcode: item.barcode,
      name: item.name,
      slug: item.slug,
      mainImage: item.main_image,
      productType: item.product_type,
      b2cPriceDzd: item.b2c_price,
      b2cSalePriceDzd: item.b2c_sale_price,
      availableStock: item.available_stock,
      relevanceScore: item.relevance_score,
    }));
  }
}
