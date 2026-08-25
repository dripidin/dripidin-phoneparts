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

class CatalogProvider {
  private static cachedData: {
    metadata: CatalogMetadata;
    brands: CatalogBrand[];
    categories: CatalogCategory[];
    products: CatalogProduct[];
    productImages: any[];
  } | null = null;

  public static loadCatalog() {
    if (this.cachedData) return this.cachedData;

    try {
      const jsonPath = path.join(process.cwd(), 'src/lib/data/initial-catalog.json');
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, 'utf-8');
        this.cachedData = JSON.parse(raw);
        return this.cachedData!;
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

  public static getAllProducts(activeOnly = true): CatalogProduct[] {
    const data = this.loadCatalog();
    if (!data.products) return [];
    return activeOnly ? data.products.filter(p => p.status === 'ACTIVE' && p.is_visible) : data.products;
  }

  public static getBrands(): CatalogBrand[] {
    const data = this.loadCatalog();
    return data.brands || [];
  }

  public static getCategories(): CatalogCategory[] {
    const data = this.loadCatalog();
    return data.categories || [];
  }

  public static findBySlug(slug: string): CatalogProduct | null {
    const products = this.getAllProducts(false);
    return products.find(p => p.slug === slug) || null;
  }

  public static findBySku(sku: string): CatalogProduct | null {
    const products = this.getAllProducts(false);
    return products.find(p => p.sku === sku) || null;
  }

  public static search(query: string, limit = 20): CatalogProduct[] {
    const term = query.toLowerCase().trim();
    if (!term) return [];
    const products = this.getAllProducts(true);
    return products.filter(p => 
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.brands.name.toLowerCase().includes(term) ||
      p.categories.name.toLowerCase().includes(term)
    ).slice(0, limit);
  }
}

export { CatalogProvider };
