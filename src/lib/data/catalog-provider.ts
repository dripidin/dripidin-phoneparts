// HamzaPhone Static & Fallback Catalog Data Provider
// Powers instantaneous search, category browsing, and storefront rendering using the migrated catalog

import fs from 'fs';
import path from 'path';

export interface CatalogMetadata {
  generatedAt: string;
  version: string;
  totalProducts: number;
  activeCount: number;
  draftCount: number;
  archivedCount: number;
  brandsCount: number;
  categoriesCount: number;
}

export interface CatalogBrand {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogProduct {
  id: string;
  source_product_id: number;
  sku: string;
  barcode: string | null;
  supplier_sku: string | null;
  name: string;
  slug: string;
  brand_id: string;
  category_id: string;
  product_type: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  is_visible: boolean;
  is_featured: boolean;
  short_description: string | null;
  description: string | null;
  main_image: string;
  gallery: string[];
  cost_price_dzd: number;
  b2c_price_dzd: number;
  b2c_sale_price_dzd: number | null;
  b2b_price_dzd: number;
  stock_quantity: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  weight_grams: number;
  dimensions_cm: { length: number; width: number; height: number };
  compatibility: Array<{ model_name: string }>;
  primary_supplier_id: string | null;
  created_at: string;
  updated_at: string;
  brands: CatalogBrand;
  categories: CatalogCategory;
}

import { DEMO_PRODUCTS } from '@/lib/demo/demo-dataset';
import { DemoModeService } from '@/lib/demo/demo-mode.service';

export interface CatalogDataPayload {
  metadata: CatalogMetadata;
  brands: CatalogBrand[];
  categories: CatalogCategory[];
  products: CatalogProduct[];
  productImages: any[];
}

class CatalogProvider {
  private static partitionCache: Map<string, CatalogDataPayload> = new Map();
  private static cachedRealData: CatalogDataPayload | null = null;

  public static clearCache(): void {
    this.partitionCache.clear();
    this.cachedRealData = null;
  }

  public static getCacheKey(isDemo: boolean): string {
    return isDemo ? 'public_catalog:DEMO' : 'public_catalog:REAL';
  }

  private static isDemoMode(explicitMode?: boolean): boolean {
    if (typeof explicitMode === 'boolean') return explicitMode;
    if (process.env.FORCE_DEMO_MODE === 'true') return true;
    if (process.env.FORCE_DEMO_MODE === 'false') return false;
    return false;
  }

  public static loadCatalog(explicitIsDemo?: boolean): CatalogDataPayload {
    const isDemo = this.isDemoMode(explicitIsDemo);
    const cacheKey = this.getCacheKey(isDemo);

    if (this.partitionCache.has(cacheKey)) {
      return this.partitionCache.get(cacheKey)!;
    }

    if (isDemo) {
      const demoProducts = DEMO_PRODUCTS as unknown as CatalogProduct[];
      const demoBrands = Array.from(new Map(DEMO_PRODUCTS.map(p => [p.brands.id, p.brands])).values());
      const demoCategories = Array.from(new Map(DEMO_PRODUCTS.map(p => [p.categories.id, p.categories])).values());

      const demoPayload: CatalogDataPayload = {
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0.0-demo',
          totalProducts: demoProducts.length,
          activeCount: demoProducts.length,
          draftCount: 0,
          archivedCount: 0,
          brandsCount: demoBrands.length,
          categoriesCount: demoCategories.length,
        },
        brands: demoBrands,
        categories: demoCategories,
        products: demoProducts,
        productImages: [],
      };

      this.partitionCache.set(cacheKey, demoPayload);
      return demoPayload;
    }

    if (this.cachedRealData) {
      this.partitionCache.set(cacheKey, this.cachedRealData);
      return this.cachedRealData;
    }

    try {
      const jsonPath = path.join(process.cwd(), 'src/lib/data/initial-catalog.json');
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        const parsed = JSON.parse(raw);
        // Strictly filter out any demo products from real static catalog
        if (parsed.products) {
          parsed.products = parsed.products.filter((p: any) => !p.is_demo && !p.sku?.startsWith('DEMO-'));
        }
        this.cachedRealData = parsed;
        return this.cachedRealData!;
      }
    } catch {
      // Return empty fallback
    }

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        totalProducts: 0,
        activeCount: 0,
        draftCount: 0,
        archivedCount: 0,
        brandsCount: 0,
        categoriesCount: 0,
      },
      brands: [],
      categories: [],
      products: [],
      productImages: [],
    };
  }

  public static getAllProducts(activeOnly = true, explicitIsDemo?: boolean): CatalogProduct[] {
    const data = this.loadCatalog(explicitIsDemo);
    if (!data.products) return [];
    return activeOnly ? data.products.filter(p => p.status === 'ACTIVE' && p.is_visible) : data.products;
  }

  public static getBrands(explicitIsDemo?: boolean): CatalogBrand[] {
    const data = this.loadCatalog(explicitIsDemo);
    return data.brands || [];
  }

  public static getCategories(explicitIsDemo?: boolean): CatalogCategory[] {
    const data = this.loadCatalog(explicitIsDemo);
    return data.categories || [];
  }

  public static findBySlug(slug: string, explicitIsDemo?: boolean): CatalogProduct | null {
    const products = this.getAllProducts(false, explicitIsDemo);
    return products.find(p => p.slug === slug) || null;
  }

  public static findBySku(sku: string, explicitIsDemo?: boolean): CatalogProduct | null {
    const products = this.getAllProducts(false, explicitIsDemo);
    return products.find(p => p.sku === sku) || null;
  }

  public static search(query: string, limit = 20, explicitIsDemo?: boolean): CatalogProduct[] {
    const term = query.toLowerCase().trim();
    if (!term) return [];
    const products = this.getAllProducts(true, explicitIsDemo);
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.brands.name.toLowerCase().includes(term) ||
      p.categories.name.toLowerCase().includes(term)
    ).slice(0, limit);
  }
}

export { CatalogProvider };
