// HamzaPhone Product Repository: High-Performance Data Access, Virtualized Pagination, Filter Facets

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProductStatus, ProductType } from '@/types/database.types';

export interface ProductFilterParams {
  brandId?: string;
  categoryId?: string;
  supplierId?: string;
  status?: ProductStatus;
  isVisible?: boolean;
  isFeatured?: boolean;
  minPriceDzd?: number;
  maxPriceDzd?: number;
  lowStockOnly?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'name' | 'created_at' | 'b2c_price_dzd' | 'stock_quantity';
  sortDirection?: 'asc' | 'desc';
}

export class ProductRepository {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Query paginated products with multi-facet filters and total counts
   */
  async findMany(params: ProductFilterParams = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = (this.supabase
      .from('products') as any)
      .select(`
        id,
        sku,
        barcode,
        supplier_sku,
        name,
        slug,
        brand_id,
        category_id,
        product_type,
        status,
        is_visible,
        is_featured,
        short_description,
        main_image,
        cost_price_dzd,
        b2c_price_dzd,
        b2c_sale_price_dzd,
        b2b_price_dzd,
        stock_quantity,
        reserved_stock,
        available_stock,
        low_stock_threshold,
        weight_grams,
        compatibility,
        created_at,
        updated_at,
        brands(name, slug),
        categories(name, slug)
      `, { count: 'exact' });

    if (params.brandId) query = query.eq('brand_id', params.brandId);
    if (params.categoryId) query = query.eq('category_id', params.categoryId);
    if (params.supplierId) query = query.eq('primary_supplier_id', params.supplierId);
    if (params.status) query = query.eq('status', params.status);
    if (params.isVisible !== undefined) query = query.eq('is_visible', params.isVisible);
    if (params.isFeatured !== undefined) query = query.eq('is_featured', params.isFeatured);
    if (params.minPriceDzd !== undefined) query = query.gte('b2c_price_dzd', params.minPriceDzd);
    if (params.maxPriceDzd !== undefined) query = query.lte('b2c_price_dzd', params.maxPriceDzd);

    if (params.search) {
      const term = params.search.trim();
      query = query.or(`sku.ilike.%${term}%,name.ilike.%${term}%,barcode.eq.${term}`);
    }

    const sortBy = params.sortBy || 'created_at';
    const sortDir = params.sortDirection === 'asc';
    query = query.order(sortBy, { ascending: sortDir }).range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(`Product query failed: ${error.message}`);

    return {
      products: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Find product by unique slug with gallery images and full device compatibility
   */
  async findBySlug(slug: string) {
    const { data, error } = await (this.supabase
      .from('products') as any)
      .select(`
        *,
        brands(id, name, slug, logo_url),
        categories(id, name, slug),
        product_images(id, image_url, alt_text, display_order, is_cover),
        product_compatibility(
          id,
          variant_codes,
          notes,
          device_models(id, name, slug, model_code, release_year)
        )
      `)
      .eq('slug', slug)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string) {
    const { data, error } = await (this.supabase
      .from('products') as any)
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) return null;
    return data;
  }
}
