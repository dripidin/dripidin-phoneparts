// Unit and Integration Tests for HamzaPhone Initial Catalog Migration Engine & Live Data Integration

import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {
  generateSku,
  generateSlug,
  extractBrand,
  extractComponentType,
} from '../../../scripts/catalog-migration-engine';
import { CatalogProvider } from '../data/catalog-provider';
import { StorefrontService } from '../services/storefront.service';

describe('HamzaPhone Initial Catalog Migration Engine & Real Catalog Verification', () => {
  describe('1. Deterministic SKU Generation', () => {
    it('should generate structured, unique and deterministic commercial SKUs', () => {
      const sku1 = generateSku('Samsung', 'Écrans & Afficheurs', 22177);
      const sku2 = generateSku('Apple', 'Batteries', 22180);
      const sku3 = generateSku('Xiaomi', 'Connecteurs de Charge', 22181);

      assert.strictEqual(sku1, 'HP-SAM-SCR-22177');
      assert.strictEqual(sku2, 'HP-APP-BAT-22180');
      assert.strictEqual(sku3, 'HP-XIA-CHG-22181');
    });

    it('should handle generic and unclassified brands gracefully', () => {
      const sku = generateSku('Générique / Autre', 'Pièces Détachées Diverses', 35000);
      assert.strictEqual(sku, 'HP-GEN-PRD-35000');
    });
  });

  describe('2. Slug Generation & URL Stability', () => {
    it('should generate URL-safe, lowercase slugs with preserved source ID', () => {
      const slug = generateSlug('AFFICHEUR OPPO A74 4G ORIGINAL', 22177);
      assert.strictEqual(slug, 'afficheur-oppo-a74-4g-original-22177');
    });

    it('should strip special characters, accents and slashes safely', () => {
      const slug = generateSlug('NAPPE DE CHARGE SAMSUNG S23 PLUS ( S916B ) / TYPE-C', 24605);
      assert.strictEqual(slug, 'nappe-de-charge-samsung-s23-plus-s916b-type-c-24605');
    });
  });

  describe('3. Brand Extraction Logic', () => {
    it('should identify major smartphone manufacturers from names and categories', () => {
      assert.strictEqual(extractBrand('AFFICHEUR SAMSUNG S22 ULTRA', 'SAMSUNG S SERIES'), 'Samsung');
      assert.strictEqual(extractBrand('BATTERIE IPHONE 13 PRO MAX ORIGINAL', 'IPHONE 13'), 'Apple');
      assert.strictEqual(extractBrand('CONNECTEUR REDMI NOTE 11', 'REDMI NOTE'), 'Xiaomi');
      assert.strictEqual(extractBrand('AFFICHEUR HUAWEI Y9 PRIME 2019', 'HUAWEI'), 'Huawei');
      assert.strictEqual(extractBrand('CACHE ARRIERE OPPO RENO 8T 5G', 'OPPO RENO'), 'Oppo');
      assert.strictEqual(extractBrand('AFFICHEUR REALME C55', 'REALME C SERIES'), 'Realme');
      assert.strictEqual(extractBrand('NAPPE INFINIX HOT 30', 'INFINIX HOT'), 'Infinix');
      assert.strictEqual(extractBrand('AFFICHEUR TECNO SPARK 10 PRO', 'TECNO SPARK'), 'Tecno');
      assert.strictEqual(extractBrand('ECRAN CONDOR ALLURE M3', 'CONDOR'), 'Condor');
    });

    it('should fallback to Generic for non-branded accessories or tools', () => {
      assert.strictEqual(extractBrand('TOURNEVIS DE PRECISION 0.8 MM', 'OUTILLAGE'), 'Générique / Autre');
    });
  });

  describe('4. Component Type Classification', () => {
    it('should categorize phone parts accurately based on name keywords', () => {
      assert.strictEqual(extractComponentType('AFFICHEUR OLED SAMSUNG S21'), 'Écrans & Afficheurs');
      assert.strictEqual(extractComponentType('BATTERIE ORIGINALE IPHONE 12'), 'Batteries');
      assert.strictEqual(extractComponentType('NAPPE DE CHARGE TYPE-C REDMI 10'), 'Connecteurs de Charge');
      assert.strictEqual(extractComponentType('MODULE CAMERA ARRIERE 108MP'), 'Caméras & Capteurs');
      assert.strictEqual(extractComponentType('CACHE ARRIERE VITRE CHASSIS BLEU'), 'Vitres & Châssis');
      assert.strictEqual(extractComponentType('NFC FLIX NAPPES ANTENNE'), 'Nappes & Connectique');
      assert.strictEqual(extractComponentType('CARTE MERE DEBLOQUEE IPHONE 11'), 'Cartes Mères & Composants');
    });
  });

  describe('5. Real Migrated Catalog Integrity & Metrics', () => {
    const catalog = CatalogProvider.loadCatalog();

    it('should contain exactly 3,946 migrated products', () => {
      assert.strictEqual(catalog.products.length, 3946);
    });

    it('should have exact status distribution (3,779 ACTIVE, 166 DRAFT, 1 ARCHIVED)', () => {
      const active = catalog.products.filter(p => p.status === 'ACTIVE');
      const draft = catalog.products.filter(p => p.status === 'DRAFT');
      const archived = catalog.products.filter(p => p.status === 'ARCHIVED');

      assert.strictEqual(active.length, 3779);
      assert.strictEqual(draft.length, 166);
      assert.strictEqual(archived.length, 1);
    });

    it('should have zero duplicate SKUs across all 3,946 products', () => {
      const skus = new Set(catalog.products.map(p => p.sku));
      assert.strictEqual(skus.size, 3946);
    });

    it('should have zero duplicate Slugs across all 3,946 products', () => {
      const slugs = new Set(catalog.products.map(p => p.slug));
      assert.strictEqual(slugs.size, 3946);
    });

    it('should guarantee zero ACTIVE products with price <= 0 DZD', () => {
      const invalidActive = catalog.products.filter(p => p.status === 'ACTIVE' && p.b2c_price_dzd <= 0);
      assert.strictEqual(invalidActive.length, 0);
    });

    it('should guarantee 100% of products have an image reference', () => {
      const withoutImage = catalog.products.filter(p => !p.main_image);
      assert.strictEqual(withoutImage.length, 0);
    });

    it('should contain 19 normalized brands and 9 core categories', () => {
      assert.strictEqual(catalog.brands.length, 19);
      assert.strictEqual(catalog.categories.length, 9);
    });
  });

  describe('6. StorefrontService Integration with Migrated Catalog', () => {
    // Mock Supabase that returns empty data to test seamless static catalog fallback
    const mockSupabase: any = {
      from: () => ({
        select: () => ({
          eq: function() { return this; },
          neq: function() { return this; },
          gt: function() { return this; },
          gte: function() { return this; },
          lte: function() { return this; },
          or: function() { return this; },
          ilike: function() { return this; },
          order: function() { return this; },
          range: async () => ({ data: [], count: 0, error: null }),
          limit: async () => ({ data: [], error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    };

    const storefrontService = new StorefrontService(mockSupabase);

    it('should paginate active products from catalog cache', async () => {
      const res = await storefrontService.getProducts({ page: 1, pageSize: 20 });
      assert.strictEqual(res.products.length, 20);
      assert.strictEqual(res.totalCount, 3779);
      assert.strictEqual(res.totalPages, Math.ceil(3779 / 20));
      assert.ok(res.products[0].b2cPriceDzd > 0);
      assert.ok(res.products[0].sku.startsWith('HP-'));
    });

    it('should find specific product detail by slug', async () => {
      const detail = await storefrontService.getProductBySlug('afficheur-oppo-a74-4g-original-22177');
      assert.ok(detail);
      assert.strictEqual(detail.sku, 'HP-OPP-SCR-22177');
      assert.strictEqual(detail.b2cPriceDzd, 12800);
      assert.strictEqual(detail.brand?.name, 'Oppo');
    });

    it('should provide multi-entity instant search suggestions from catalog', async () => {
      const searchRes = await storefrontService.getInstantSearchSuggestions('Samsung');
      assert.ok(searchRes.products.length > 0);
      assert.ok(searchRes.brands.length > 0);
      assert.strictEqual(searchRes.query, 'Samsung');
    });

    it('should retrieve homepage rails and popular brands', async () => {
      const home = await storefrontService.getHomepageData();
      assert.strictEqual(home.brands.length, 12);
      assert.strictEqual(home.categories.length, 8);
      assert.strictEqual(home.featuredProducts.length, 8);
      assert.strictEqual(home.newArrivals.length, 8);
    });
  });
});
