// Unit & Integration Test Suite for HamzaPhone Storefront Service, Search & Price Shielding

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { StorefrontService } from './storefront.service';
import { SearchService } from './search.service';

function createMockStorefrontSupabase(mockProducts: any[], mockCategories: any[], mockBrands: any[], mockModels: any[]) {
  return {
    from: (table: string) => {
      if (table === 'products') {
        return {
          select: (columns: string, options?: any) => {
            let filtered = [...mockProducts];
            return {
              eq: function(field: string, val: any) {
                if (field === 'status') filtered = filtered.filter(p => p.status === val);
                if (field === 'is_visible') filtered = filtered.filter(p => p.is_visible === val);
                if (field === 'is_featured') filtered = filtered.filter(p => p.is_featured === val);
                if (field === 'category_id') filtered = filtered.filter(p => p.category_id === val);
                if (field === 'brand_id') filtered = filtered.filter(p => p.brand_id === val);
                if (field === 'categories.slug') filtered = filtered.filter(p => p.categories?.slug === val);
                if (field === 'brands.slug') filtered = filtered.filter(p => p.brands?.slug === val);
                if (field === 'slug') filtered = filtered.filter(p => p.slug === val);
                return this;
              },
              neq: function(field: string, val: any) {
                if (field === 'id') filtered = filtered.filter(p => p.id !== val);
                return this;
              },
              gt: function(field: string, val: any) {
                if (field === 'available_stock') filtered = filtered.filter(p => (p.available_stock || 0) > val);
                return this;
              },
              gte: function(field: string, val: any) {
                if (field === 'b2c_price_dzd') filtered = filtered.filter(p => Number(p.b2c_price_dzd) >= val);
                return this;
              },
              lte: function(field: string, val: any) {
                if (field === 'b2c_price_dzd') filtered = filtered.filter(p => Number(p.b2c_price_dzd) <= val);
                return this;
              },
              or: function(pattern: string) {
                // simple search match
                const termMatch = pattern.match(/%([^%]+)%/);
                const term = termMatch ? termMatch[1].toLowerCase() : '';
                if (term) {
                  filtered = filtered.filter(p => 
                    p.name?.toLowerCase().includes(term) || 
                    p.sku?.toLowerCase().includes(term) || 
                    p.barcode === term
                  );
                }
                return this;
              },
              order: function(field: string, opts?: any) {
                return this;
              },
              range: async function(offset: number, limit: number) {
                const sliced = filtered.slice(offset, limit + 1);
                return { data: sliced, count: filtered.length, error: null };
              },
              limit: async function(count: number) {
                return { data: filtered.slice(0, count), error: null };
              },
              single: async function() {
                return { data: filtered[0] || null, error: filtered[0] ? null : new Error('Not found') };
              },
              maybeSingle: async function() {
                return { data: filtered[0] || null, error: null };
              },
            };
          },
        };
      }
      if (table === 'categories') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: mockCategories, error: null }),
              }),
              ilike: () => ({
                limit: async () => ({ data: mockCategories.slice(0, 3), error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'brands') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: mockBrands, error: null }),
              }),
              ilike: () => ({
                limit: async () => ({ data: mockBrands.slice(0, 3), error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'device_models') {
        return {
          select: () => ({
            ilike: () => ({
              limit: async () => ({ data: mockModels, error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) };
    },
  } as any;
}

const mockProductsData = [
  {
    id: 'prod-1',
    sku: 'SCR-SAM-S22U-001',
    barcode: '61300010001',
    name: 'Écran OLED Complet Samsung Galaxy S22 Ultra (Avec Châssis)',
    slug: 'ecran-oled-samsung-galaxy-s22-ultra',
    brand_id: 'brand-sam',
    category_id: 'cat-screen',
    product_type: 'SCREEN',
    status: 'ACTIVE',
    is_visible: true,
    is_featured: true,
    short_description: 'Écran Dynamic AMOLED 2X 120Hz original avec châssis.',
    description: 'Bloc écran complet pré-assemblé avec nappe tactile et afficheur.',
    main_image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea',
    gallery: ['https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea'],
    cost_price_dzd: 22000, // SHOULD BE SHIELDED!
    b2c_price_dzd: 32000,
    b2c_sale_price_dzd: 29500,
    b2b_price_dzd: 26000,
    stock_quantity: 15,
    reserved_stock: 2,
    available_stock: 13,
    weight_grams: 140,
    dimensions_cm: '16.3 x 7.8 x 0.9 cm',
    created_at: '2026-08-20T10:00:00Z',
    brands: { id: 'brand-sam', name: 'Samsung', slug: 'samsung' },
    categories: { id: 'cat-screen', name: 'Écrans & Afficheurs', slug: 'ecrans-afficheurs' },
    product_compatibility: [
      {
        id: 'comp-1',
        variant_codes: ['SM-S908B', 'SM-S908U', 'SM-S908N'],
        notes: 'Compatible toutes versions internationales Exynos et Snapdragon',
        device_models: {
          id: 'dev-1',
          name: 'Samsung Galaxy S22 Ultra',
          slug: 'galaxy-s22-ultra',
          model_code: 'SM-S908',
          release_year: 2022,
        },
      },
    ],
  },
  {
    id: 'prod-2',
    sku: 'BAT-APP-IP13-001',
    barcode: '61300010002',
    name: 'Batterie Haute Capacité iPhone 13 (3227 mAh avec Nappe)',
    slug: 'batterie-haute-capacite-iphone-13',
    brand_id: 'brand-app',
    category_id: 'cat-bat',
    product_type: 'BATTERY',
    status: 'ACTIVE',
    is_visible: true,
    is_featured: false,
    short_description: 'Batterie lithium-ion zéro cycle certifiée CE.',
    description: 'Cellule haute densité avec puce TI conforme aux spécifications Apple.',
    main_image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea',
    gallery: [],
    cost_price_dzd: 2400,
    b2c_price_dzd: 4500,
    b2c_sale_price_dzd: null,
    b2b_price_dzd: 3200,
    stock_quantity: 50,
    reserved_stock: 0,
    available_stock: 50,
    weight_grams: 65,
    dimensions_cm: null,
    created_at: '2026-08-21T10:00:00Z',
    brands: { id: 'brand-app', name: 'Apple', slug: 'apple' },
    categories: { id: 'cat-bat', name: 'Batteries', slug: 'batteries' },
    product_compatibility: [
      {
        id: 'comp-2',
        variant_codes: ['A2633', 'A2482', 'A2631', 'A2634'],
        notes: 'Adhésif de pose batterie inclus',
        device_models: {
          id: 'dev-2',
          name: 'Apple iPhone 13',
          slug: 'iphone-13',
          model_code: 'A2633',
          release_year: 2021,
        },
      },
    ],
  },
];

const mockCategoriesData = [
  { id: 'cat-screen', name: 'Écrans & Afficheurs', slug: 'ecrans-afficheurs', image_url: null, display_order: 1 },
  { id: 'cat-bat', name: 'Batteries', slug: 'batteries', image_url: null, display_order: 2 },
];

const mockBrandsData = [
  { id: 'brand-sam', name: 'Samsung', slug: 'samsung', logo_url: null },
  { id: 'brand-app', name: 'Apple', slug: 'apple', logo_url: null },
];

const mockModelsData = [
  { id: 'dev-1', name: 'Samsung Galaxy S22 Ultra', slug: 'galaxy-s22-ultra', model_code: 'SM-S908', brands: { name: 'Samsung' } },
  { id: 'dev-2', name: 'Apple iPhone 13', slug: 'iphone-13', model_code: 'A2633', brands: { name: 'Apple' } },
];

describe('StorefrontService: Catalog Queries, Cost Price Shielding & Compatibility', () => {
  const mockSupabase = createMockStorefrontSupabase(
    mockProductsData,
    mockCategoriesData,
    mockBrandsData,
    mockModelsData
  );
  const service = new StorefrontService(mockSupabase);

  it('should query paginated catalog and exclude cost_price_dzd from results', async () => {
    const res = await service.getProducts({ page: 1, pageSize: 10 });
    assert.strictEqual(res.products.length, 2);
    assert.strictEqual(res.totalCount, 2);
    assert.strictEqual(res.page, 1);

    const first = res.products[0];
    assert.strictEqual(first.sku, 'SCR-SAM-S22U-001');
    assert.strictEqual(first.b2cPriceDzd, 32000);
    assert.strictEqual(first.b2cSalePriceDzd, 29500);
    assert.strictEqual(first.effectivePriceDzd, 29500);
    assert.strictEqual(first.isOnSale, true);
    assert.strictEqual(first.availableStock, 13);
    assert.strictEqual(first.isAvailable, true);

    // CRITICAL SECURITY ASSERTION: cost_price_dzd must NEVER exist in public payload
    assert.strictEqual((first as any).cost_price_dzd, undefined);
    assert.strictEqual((first as any).costPriceDzd, undefined);
  });

  it('should retrieve full product detail with structured device compatibility', async () => {
    const product = await service.getProductBySlug('ecran-oled-samsung-galaxy-s22-ultra');
    assert.ok(product);
    assert.strictEqual(product.name, 'Écran OLED Complet Samsung Galaxy S22 Ultra (Avec Châssis)');
    assert.strictEqual(product.brand?.name, 'Samsung');
    assert.strictEqual(product.category?.name, 'Écrans & Afficheurs');

    // Compatibility check
    assert.strictEqual(product.compatibility.length, 1);
    const comp = product.compatibility[0];
    assert.strictEqual(comp.deviceModel?.name, 'Samsung Galaxy S22 Ultra');
    assert.strictEqual(comp.deviceModel?.modelCode, 'SM-S908');
    assert.deepStrictEqual(comp.variantCodes, ['SM-S908B', 'SM-S908U', 'SM-S908N']);

    // CRITICAL SECURITY ASSERTION: cost_price_dzd shielded
    assert.strictEqual((product as any).cost_price_dzd, undefined);
    assert.strictEqual((product as any).costPriceDzd, undefined);
  });

  it('should return null when product slug does not exist', async () => {
    const product = await service.getProductBySlug('non-existent-part-slug-xyz');
    assert.strictEqual(product, null);
  });

  it('should aggregate homepage data with categories, brands and rails', async () => {
    const home = await service.getHomepageData();
    assert.strictEqual(home.categories.length, 2);
    assert.strictEqual(home.brands.length, 2);
    assert.strictEqual(home.featuredProducts.length, 1);
    assert.strictEqual(home.featuredProducts[0].sku, 'SCR-SAM-S22U-001');
    assert.strictEqual(home.newArrivals.length, 2);
  });
});

describe('StorefrontService: Instant Search & Sanitization', () => {
  const mockSupabase = createMockStorefrontSupabase(
    mockProductsData,
    mockCategoriesData,
    mockBrandsData,
    mockModelsData
  );
  const service = new StorefrontService(mockSupabase);

  it('should return multi-entity suggestions for valid query', async () => {
    const results = await service.getInstantSearchSuggestions('Samsung');
    assert.strictEqual(results.query, 'Samsung');
    assert.ok(results.products.length > 0);
    assert.strictEqual(results.products[0].sku, 'SCR-SAM-S22U-001');
    assert.strictEqual(results.categories.length, 2);
    assert.strictEqual(results.brands.length, 2);
    assert.strictEqual(results.deviceModels.length, 2);
  });

  it('should sanitize search query and preserve alphanumeric & Arabic strings', () => {
    const sanitized1 = SearchService.sanitizeQuery('   Samsung-S22; DROP TABLE products;--  ');
    assert.strictEqual(sanitized1, 'Samsung-S22 DROP TABLE products');

    const sanitized2 = SearchService.sanitizeQuery('شاشة سامسونج OLED');
    assert.strictEqual(sanitized2, 'شاشة سامسونج OLED');
  });

  it('should return empty results if query is less than 2 characters', async () => {
    const results = await service.getInstantSearchSuggestions('a');
    assert.deepStrictEqual(results.products, []);
    assert.deepStrictEqual(results.categories, []);
  });
});
