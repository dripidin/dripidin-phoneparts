// HamzaPhone Storefront Service: Public Catalog, Instant Search, Compatibility Resolution & Price Shielding

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductType } from '@/types/database.types';
import { SearchService } from './search.service';
import { CatalogProvider } from '@/lib/data/catalog-provider';

export interface PublicProductSummary {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  slug: string;
  brandName?: string;
  brandSlug?: string;
  categoryName?: string;
  categorySlug?: string;
  productType: ProductType;
  mainImage: string;
  b2cPriceDzd: number;
  b2cSalePriceDzd: number | null;
  effectivePriceDzd: number;
  isOnSale: boolean;
  stockQuantity: number;
  availableStock: number;
  isAvailable: boolean;
  isFeatured: boolean;
  compatibilityList?: string[];
  createdAt: string;
}

export interface PublicProductDetail extends PublicProductSummary {
  shortDescription: string | null;
  description: string | null;
  gallery: string[];
  productImages: Array<{
    id: string;
    imageUrl: string;
    altText: string | null;
    displayOrder: number;
    isCover: boolean;
  }>;
  weightGrams: number | null;
  dimensionsCm: string | null;
  brand: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  compatibility: Array<{
    id: string;
    variantCodes: string[];
    notes: string | null;
    deviceModel: {
      id: string;
      name: string;
      slug: string;
      modelCode: string;
      releaseYear?: number;
    } | null;
  }>;
  relatedProducts: PublicProductSummary[];
}

export interface StorefrontCatalogParams {
  categorySlug?: string;
  brandSlug?: string;
  productType?: ProductType;
  inStockOnly?: boolean;
  isFeatured?: boolean;
  minPriceDzd?: number;
  maxPriceDzd?: number;
  search?: string;
  deviceModelSlug?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
}

export interface InstantSearchSuggestions {
  query: string;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    sku: string;
    mainImage: string;
    priceDzd: number;
    salePriceDzd: number | null;
    availableStock: number;
    brandName?: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  brands: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  deviceModels: Array<{
    id: string;
    name: string;
    slug: string;
    modelCode: string;
    brandName?: string;
  }>;
}

export class StorefrontService {
  constructor(private supabase: SupabaseClient<any, any, any>) {}

  /**
   * Helper to format dimensions into human-readable string (preventing React child object error)
   */
  private formatDimensions(dims: any): string | null {
    if (!dims) return null;
    if (typeof dims === 'string') return dims;
    if (typeof dims === 'object') {
      const { length, width, height } = dims;
      if (length !== undefined || width !== undefined || height !== undefined) {
        return `${length || '—'} × ${width || '—'} × ${height || '—'} cm`;
      }
      return JSON.stringify(dims);
    }
    return String(dims);
  }

  /**
   * Helper to format raw product row into public summary with cost_price strictly excluded
   */
  private formatSummary(p: any): PublicProductSummary {
    const b2cPrice = Number(p.b2c_price_dzd) || 0;
    const salePrice = p.b2c_sale_price_dzd ? Number(p.b2c_sale_price_dzd) : null;
    const isOnSale = Boolean(salePrice && salePrice > 0 && salePrice < b2cPrice);
    const effectivePrice = isOnSale ? (salePrice as number) : b2cPrice;
    const availableStock = Math.max(0, (p.stock_quantity || 0) - (p.reserved_stock || 0));

    // Extract compatibility device names if available
    const compatibilityList = Array.isArray(p.compatibility) 
      ? p.compatibility.map((c: any) => typeof c === 'string' ? c : c?.model_name || c?.device_name || c?.model_code || c?.name).filter(Boolean)
      : [];

    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode || null,
      name: p.name,
      slug: p.slug,
      brandName: p.brands?.name || undefined,
      brandSlug: p.brands?.slug || undefined,
      categoryName: p.categories?.name || undefined,
      categorySlug: p.categories?.slug || undefined,
      productType: p.product_type || 'PART',
      mainImage: p.main_image || '/images/placeholder-product.webp',
      b2cPriceDzd: b2cPrice,
      b2cSalePriceDzd: salePrice,
      effectivePriceDzd: effectivePrice,
      isOnSale,
      stockQuantity: p.stock_quantity || 0,
      availableStock,
      isAvailable: availableStock > 0,
      isFeatured: Boolean(p.is_featured),
      compatibilityList,
      createdAt: p.created_at || new Date().toISOString(),
    };
  }

  /**
   * Query paginated catalog for customer storefront with multi-facet filters
   */
  async getProducts(params: StorefrontCatalogParams = {}) {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(60, Math.max(1, params.pageSize || 24));
    const offset = (page - 1) * pageSize;

    let query = this.supabase
      .from('products')
      .select(`
        id,
        sku,
        barcode,
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
        b2c_price_dzd,
        b2c_sale_price_dzd,
        stock_quantity,
        reserved_stock,
        available_stock,
        weight_grams,
        compatibility,
        created_at,
        brands!inner(id, name, slug),
        categories!inner(id, name, slug)
      `, { count: 'exact' })
      .eq('status', 'ACTIVE')
      .eq('is_visible', true);

    if (params.categorySlug) {
      query = query.eq('categories.slug', params.categorySlug);
    }

    if (params.brandSlug) {
      query = query.eq('brands.slug', params.brandSlug);
    }

    if (params.productType) {
      query = query.eq('product_type', params.productType);
    }

    if (params.isFeatured) {
      query = query.eq('is_featured', true);
    }

    if (params.inStockOnly) {
      query = query.gt('available_stock', 0);
    }

    if (params.minPriceDzd !== undefined && params.minPriceDzd > 0) {
      query = query.gte('b2c_price_dzd', params.minPriceDzd);
    }

    if (params.maxPriceDzd !== undefined && params.maxPriceDzd > 0) {
      query = query.lte('b2c_price_dzd', params.maxPriceDzd);
    }

    if (params.search) {
      const sanitized = SearchService.sanitizeQuery(params.search);
      if (sanitized) {
        query = query.or(`sku.ilike.%${sanitized}%,name.ilike.%${sanitized}%,barcode.eq.${sanitized}`);
      }
    }

    // Sorting
    switch (params.sortBy) {
      case 'price_asc':
        query = query.order('b2c_price_dzd', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('b2c_price_dzd', { ascending: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'featured':
      default:
        query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false });
        break;
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data, count, error } = await query;
    if (error) {
      // Fallback without !inner join in case relationships are missing in test DB
      const fallbackQuery = this.supabase
        .from('products')
        .select(`
          id, sku, barcode, name, slug, brand_id, category_id, product_type,
          status, is_visible, is_featured, short_description, main_image,
          b2c_price_dzd, b2c_sale_price_dzd, stock_quantity, reserved_stock,
          available_stock, weight_grams, compatibility, created_at,
          brands(name, slug), categories(name, slug)
        `, { count: 'exact' })
        .eq('status', 'ACTIVE')
        .eq('is_visible', true)
        .range(offset, offset + pageSize - 1);

      const fallbackRes = await fallbackQuery;
      return {
        products: (fallbackRes.data || []).map((p: any) => this.formatSummary(p)),
        totalCount: fallbackRes.count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((fallbackRes.count || 0) / pageSize),
      };
    }

    const formatted = (data || []).map((p: any) => this.formatSummary(p));

    if (formatted.length === 0) {
      const staticProducts = CatalogProvider.getAllProducts(true);
      if (staticProducts.length > 0) {
        let filtered = staticProducts;
        if (params.categorySlug) filtered = filtered.filter(p => p.categories?.slug === params.categorySlug);
        if (params.brandSlug) filtered = filtered.filter(p => p.brands?.slug === params.brandSlug);
        if (params.isFeatured) filtered = filtered.filter(p => p.is_featured);
        if (params.minPriceDzd) filtered = filtered.filter(p => p.b2c_price_dzd >= params.minPriceDzd!);
        if (params.maxPriceDzd) filtered = filtered.filter(p => p.b2c_price_dzd <= params.maxPriceDzd!);
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
        }
        const total = filtered.length;
        const paged = filtered.slice(offset, offset + pageSize);
        return {
          products: paged.map(p => this.formatSummary(p)),
          totalCount: total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        };
      }
    }

    return {
      products: formatted,
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Fetch full product details by unique slug
   */
  async getProductBySlug(slug: string): Promise<PublicProductDetail | null> {
    const { data: product, error } = await this.supabase
      .from('products')
      .select(`
        id,
        sku,
        barcode,
        name,
        slug,
        brand_id,
        category_id,
        product_type,
        status,
        is_visible,
        is_featured,
        short_description,
        description,
        main_image,
        gallery,
        b2c_price_dzd,
        b2c_sale_price_dzd,
        stock_quantity,
        reserved_stock,
        available_stock,
        weight_grams,
        dimensions_cm,
        compatibility,
        created_at,
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
      .eq('status', 'ACTIVE')
      .eq('is_visible', true)
      .maybeSingle();

    if (error || !product) {
      const staticProd = CatalogProvider.findBySlug(slug);
      if (!staticProd) return null;

      const staticSummary = this.formatSummary(staticProd);
      const relatedStatic = CatalogProvider.getAllProducts(true)
        .filter(p => p.category_id === staticProd.category_id && p.id !== staticProd.id)
        .slice(0, 4)
        .map(p => this.formatSummary(p));

      return {
        ...staticSummary,
        shortDescription: staticProd.short_description || null,
        description: staticProd.description || null,
        gallery: staticProd.gallery && staticProd.gallery.length > 0 ? staticProd.gallery : [staticProd.main_image],
        productImages: (staticProd.gallery || []).map((g, idx) => ({
          id: `img-${idx}`,
          imageUrl: g,
          altText: staticProd.name,
          displayOrder: idx + 1,
          isCover: idx === 0,
        })),
        weightGrams: staticProd.weight_grams,
        dimensionsCm: typeof staticProd.dimensions_cm === 'object' ? JSON.stringify(staticProd.dimensions_cm) : staticProd.dimensions_cm,
        brand: staticProd.brands ? {
          id: staticProd.brands.id,
          name: staticProd.brands.name,
          slug: staticProd.brands.slug,
          logoUrl: null,
        } : null,
        category: staticProd.categories ? {
          id: staticProd.categories.id,
          name: staticProd.categories.name,
          slug: staticProd.categories.slug,
        } : null,
        compatibility: (staticProd.compatibility || []).map((c, i) => ({
          id: `comp-${i}`,
          variantCodes: [],
          notes: null,
          deviceModel: {
            id: `dm-${i}`,
            name: c.model_name,
            slug: c.model_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            modelCode: '',
          },
        })),
        relatedProducts: relatedStatic,
      };
    }

    const baseSummary = this.formatSummary(product);

    // Format gallery images
    const rawImages = (product.product_images || []) as any[];
    const productImages = rawImages.map((img: any) => ({
      id: img.id,
      imageUrl: img.image_url,
      altText: img.alt_text || null,
      displayOrder: img.display_order || 0,
      isCover: Boolean(img.is_cover),
    }));

    const gallery = Array.isArray(product.gallery) && product.gallery.length > 0
      ? product.gallery
      : productImages.map((img: any) => img.imageUrl);

    if (gallery.length === 0) {
      gallery.push(baseSummary.mainImage);
    }

    // Format compatibility list
    const rawComp = (product.product_compatibility || []) as any[];
    const compatibility = rawComp.map((c: any) => ({
      id: c.id,
      variantCodes: Array.isArray(c.variant_codes) ? c.variant_codes : [],
      notes: c.notes || null,
      deviceModel: c.device_models ? {
        id: c.device_models.id,
        name: c.device_models.name,
        slug: c.device_models.slug,
        modelCode: c.device_models.model_code,
        releaseYear: c.device_models.release_year,
      } : null,
    }));

    // Fetch related products (same category or brand, excluding this one)
    const { data: relatedData } = await this.supabase
      .from('products')
      .select(`
        id, sku, barcode, name, slug, product_type, status, is_visible, is_featured,
        main_image, b2c_price_dzd, b2c_sale_price_dzd, stock_quantity, reserved_stock,
        available_stock, created_at, brands(name, slug), categories(name, slug)
      `)
      .eq('status', 'ACTIVE')
      .eq('is_visible', true)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .limit(4);

    const relatedProducts = (relatedData || []).map((p: any) => this.formatSummary(p));

    return {
      ...baseSummary,
      shortDescription: product.short_description || null,
      description: product.description || null,
      gallery,
      productImages,
      weightGrams: product.weight_grams ? Number(product.weight_grams) : null,
      dimensionsCm: this.formatDimensions(product.dimensions_cm),
      brand: (product as any).brands ? {
        id: (product as any).brands.id,
        name: (product as any).brands.name,
        slug: (product as any).brands.slug,
        logoUrl: (product as any).brands.logo_url || null,
      } : null,
      category: (product as any).categories ? {
        id: (product as any).categories.id,
        name: (product as any).categories.name,
        slug: (product as any).categories.slug,
      } : null,
      compatibility,
      relatedProducts,
    };
  }

  /**
   * Multi-entity instant search query for real-time suggestions before pressing Enter
   */
  async getInstantSearchSuggestions(rawQuery: string): Promise<InstantSearchSuggestions> {
    const query = SearchService.sanitizeQuery(rawQuery);
    if (!query || query.length < 2) {
      return { query, products: [], categories: [], brands: [], deviceModels: [] };
    }

    const [productsRes, categoriesRes, brandsRes, modelsRes] = await Promise.all([
      // 1. Products search
      this.supabase
        .from('products')
        .select(`
          id, sku, name, slug, main_image, b2c_price_dzd, b2c_sale_price_dzd,
          stock_quantity, reserved_stock, available_stock, brands(name)
        `)
        .eq('status', 'ACTIVE')
        .eq('is_visible', true)
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
        .limit(6),

      // 2. Categories search
      this.supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(3),

      // 3. Brands search
      this.supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(3),

      // 4. Device Models search
      this.supabase
        .from('device_models')
        .select('id, name, slug, model_code, brands(name)')
        .ilike('name', `%${query}%`)
        .limit(4),
    ]);

    let products = (productsRes.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      mainImage: p.main_image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=200&q=80',
      priceDzd: Number(p.b2c_price_dzd) || 0,
      salePriceDzd: p.b2c_sale_price_dzd ? Number(p.b2c_sale_price_dzd) : null,
      availableStock: Math.max(0, (p.stock_quantity || 0) - (p.reserved_stock || 0)),
      brandName: p.brands?.name || undefined,
    }));

    if (products.length === 0) {
      const staticHits = CatalogProvider.search(query, 6);
      products = staticHits.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        mainImage: p.main_image,
        priceDzd: p.b2c_price_dzd,
        salePriceDzd: p.b2c_sale_price_dzd,
        availableStock: p.available_stock,
        brandName: p.brands?.name,
      }));
    }

    let categories = (categoriesRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));

    if (categories.length === 0) {
      const allCats = CatalogProvider.getCategories();
      categories = allCats.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);
    }

    let brands = (brandsRes.data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
    }));

    if (brands.length === 0) {
      const allBrands = CatalogProvider.getBrands();
      brands = allBrands.filter(b => b.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);
    }

    const deviceModels = (modelsRes.data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      slug: m.slug,
      modelCode: m.model_code,
      brandName: m.brands?.name || undefined,
    }));

    return {
      query,
      products,
      categories,
      brands,
      deviceModels,
    };
  }

  /**
   * Aggregate Homepage Data (Featured categories, Popular brands, Featured parts, New arrivals)
   */
  async getHomepageData() {
    const [categoriesRes, brandsRes, featuredRes, newArrivalsRes] = await Promise.all([
      // Categories with order
      this.supabase
        .from('categories')
        .select('id, name, slug, image_url, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(8),

      // Popular brands
      this.supabase
        .from('brands')
        .select('id, name, slug, logo_url')
        .eq('is_active', true)
        .order('name', { ascending: true })
        .limit(12),

      // Featured products
      this.supabase
        .from('products')
        .select(`
          id, sku, barcode, name, slug, product_type, status, is_visible, is_featured,
          main_image, b2c_price_dzd, b2c_sale_price_dzd, stock_quantity, reserved_stock,
          available_stock, compatibility, created_at, brands(name, slug), categories(name, slug)
        `)
        .eq('status', 'ACTIVE')
        .eq('is_visible', true)
        .eq('is_featured', true)
        .limit(8),

      // New Arrivals
      this.supabase
        .from('products')
        .select(`
          id, sku, barcode, name, slug, product_type, status, is_visible, is_featured,
          main_image, b2c_price_dzd, b2c_sale_price_dzd, stock_quantity, reserved_stock,
          available_stock, compatibility, created_at, brands(name, slug), categories(name, slug)
        `)
        .eq('status', 'ACTIVE')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    let categories = (categoriesRes.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: c.image_url || null,
      displayOrder: c.display_order || 0,
    }));

    if (categories.length === 0) {
      categories = CatalogProvider.getCategories().slice(0, 8).map((c, i) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: null,
        displayOrder: i,
      }));
    }

    let brands = (brandsRes.data || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo_url || null,
    }));

    if (brands.length === 0) {
      brands = CatalogProvider.getBrands().slice(0, 12).map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: null,
      }));
    }

    let featuredProducts = (featuredRes.data || []).map((p: any) => this.formatSummary(p));
    if (featuredProducts.length === 0) {
      featuredProducts = CatalogProvider.getAllProducts(true).slice(0, 8).map(p => this.formatSummary(p));
    }

    let newArrivals = (newArrivalsRes.data || []).map((p: any) => this.formatSummary(p));
    if (newArrivals.length === 0) {
      newArrivals = CatalogProvider.getAllProducts(true).slice(8, 16).map(p => this.formatSummary(p));
    }

    return {
      categories,
      brands,
      featuredProducts,
      newArrivals,
    };
  }

  /**
   * Fetch all active categories
   */
  async getCategories() {
    const { data, error } = await this.supabase
      .from('categories')
      .select('id, name, slug, parent_id, image_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return CatalogProvider.getCategories();
    }
    return data;
  }

  /**
   * Fetch all active brands
   */
  async getBrands() {
    const { data, error } = await this.supabase
      .from('brands')
      .select('id, name, slug, logo_url')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return CatalogProvider.getBrands();
    }
    return data;
  }
}
