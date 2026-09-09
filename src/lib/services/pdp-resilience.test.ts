import { describe, it } from 'node:test';
import assert from 'node:assert';
import { StorefrontService } from './storefront.service';

function createMockSupabase(mockData: any, mockRelated: any[] = []) {
  return {
    from: (table: string) => {
      const builder: any = {
        select: () => builder,
        eq: (col: string, val: any) => {
          if (col === 'slug' && val === 'non-existent-slug') {
            return {
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: null })
                })
              })
            };
          }
          return builder;
        },
        neq: () => builder,
        limit: () => ({
          then: (resolve: any) => resolve({ data: mockRelated, error: null }),
          data: mockRelated,
          error: null,
        }),
        maybeSingle: async () => {
          return { data: mockData, error: null };
        },
      };
      return builder;
    }
  } as any;
}

describe('HamzaPhone PDP Resilience & Serialization Tests', () => {
  it('should safely serialize dimensions_cm from JSONB object into formatted string without throwing', async () => {
    const rawDbProduct = {
      id: '278843dc-ce07-4ffe-b21b-0c2bb6dfa9f9',
      sku: 'HP-SAM-A5-25710',
      barcode: '6130000025710',
      name: 'AFFICHEUR SAMSUNG A5 2016 - A510 ORIGINAL',
      slug: 'afficheur-samsung-a5-2016-a510-original-25710',
      brand_id: '8347f2eb-339e-4a5e-b126-9f94697b982c',
      category_id: 'd20c5c7b-54bc-4adf-96fe-3ba2c1090927',
      product_type: 'OEM_ORIGINAL',
      status: 'ACTIVE',
      is_visible: true,
      is_featured: false,
      short_description: 'Écran OLED original pour Samsung Galaxy A5 2016.',
      description: 'Pièce détachée certifiée.',
      main_image: '/catalog-images/products/25710/main.jpg',
      gallery: [],
      b2c_price_dzd: 5100,
      b2c_sale_price_dzd: null,
      stock_quantity: 12,
      reserved_stock: 2,
      available_stock: 10,
      weight_grams: 50,
      dimensions_cm: { width: 8, height: 1, length: 15 }, // Real DB format
      compatibility: [{ model_name: 'SAMSUNG A5 2016 ( A510 )' }],
      created_at: '2026-01-01T00:00:00Z',
      brands: { id: '8347f2eb-339e-4a5e-b126-9f94697b982c', name: 'Samsung', slug: 'samsung', logo_url: null },
      categories: { id: 'd20c5c7b-54bc-4adf-96fe-3ba2c1090927', name: 'Écrans & Afficheurs', slug: 'ecrans-afficheurs' },
      product_images: [],
      product_compatibility: [],
    };

    const service = new StorefrontService(createMockSupabase(rawDbProduct));
    const product = await service.getProductBySlug('afficheur-samsung-a5-2016-a510-original-25710');

    assert.ok(product);
    assert.strictEqual(typeof product.dimensionsCm, 'string');
    assert.strictEqual(product.dimensionsCm, '15 × 8 × 1 cm');
    assert.strictEqual(product.effectivePriceDzd, 5100);
    assert.strictEqual(product.availableStock, 10);
    assert.ok(Array.isArray(product.compatibilityList));
    assert.strictEqual(product.compatibilityList[0], 'SAMSUNG A5 2016 ( A510 )');
    assert.ok(Array.isArray(product.gallery));
    assert.strictEqual(product.gallery[0], '/catalog-images/products/25710/main.jpg');
  });

  it('should safely handle products with null dimensions, null descriptions and empty media', async () => {
    const rawMinimalProduct = {
      id: 'minimal-product-123',
      sku: 'HP-MIN-001',
      name: 'Composant Minimal Test',
      slug: 'composant-minimal-test',
      status: 'ACTIVE',
      is_visible: true,
      b2c_price_dzd: 1500,
      stock_quantity: 5,
      dimensions_cm: null,
      weight_grams: null,
      short_description: null,
      description: null,
      main_image: null,
      gallery: null,
      compatibility: null,
      brands: null,
      categories: null,
      product_images: null,
      product_compatibility: null,
    };

    const service = new StorefrontService(createMockSupabase(rawMinimalProduct));
    const product = await service.getProductBySlug('composant-minimal-test');

    assert.ok(product);
    assert.strictEqual(product.dimensionsCm, null);
    assert.strictEqual(product.mainImage, '/images/placeholder-product.webp');
    assert.deepStrictEqual(product.gallery, ['/images/placeholder-product.webp']);
    assert.deepStrictEqual(product.compatibilityList, []);
    assert.strictEqual(product.brand, null);
    assert.strictEqual(product.category, null);
  });

  it('should return null when product is not found', async () => {
    const service = new StorefrontService(createMockSupabase(null));
    const product = await service.getProductBySlug('non-existent-slug');
    assert.strictEqual(product, null);
  });
});
