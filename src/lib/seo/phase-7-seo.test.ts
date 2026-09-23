// DRIPIDIN Phase 7: Dynamic SEO Architecture & White-Label Test Suite
// Verifies centralized canonical resolution, metadata generation, XSS-safe JSON-LD structured data,
// indexability policies, and strict white-label decoupling.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCanonicalBaseUrl,
  buildCanonicalUrl,
  resolveHomeMetadata,
  resolveCatalogMetadata,
  resolveProductMetadata,
  resolveCategoryMetadata,
  resolveBrandMetadata,
  resolveSearchMetadata,
  resolvePrivateMetadata,
  buildWebSiteJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  SeoSettingsSchema,
} from './index';
import { DEFAULT_STORE_SETTINGS } from '@/lib/settings/default-settings';
import type { StoreSettings } from '@/types/settings.types';
import type { PublicProductDetail } from '@/lib/services/storefront.service';

const MOCK_STORE_SETTINGS: StoreSettings = {
  ...DEFAULT_STORE_SETTINGS,
  storeName: 'NEXUS PHONE STORE',
  legalName: 'NEXUS Mobile Tech SAS',
  tagline: 'Composants et Pièces Détachées de Précision',
  canonicalBaseUrl: 'https://nexusphonestore.com',
  metaTitle: 'NEXUS — Spécialiste des Pièces pour Téléphones Portables',
  metaDescription: 'Commandez en ligne vos pièces détachées : écrans, batteries et connecteurs avec expédition express.',
  metaKeywords: 'nexus, pieces detachees, ecrans, batteries',
  ogImageUrl: '/images/nexus-og.jpg',
  twitterHandle: '@nexusphone',
  currencyCode: 'EUR',
  currencySymbol: '€',
  currencyDecimals: 2,
  currencyPosition: 'AFTER',
  currencySpaceSeparated: true,
  defaultLocale: 'fr-FR',
  seoIndexable: true,
  seoFollowLinks: true,
};

const MOCK_PRODUCT: PublicProductDetail = {
  id: 'prod-001',
  sku: 'SCR-OLED-A54',
  barcode: '6131234567890',
  name: 'Écran OLED Haute Précision A54',
  slug: 'ecran-oled-haute-precision-a54',
  productType: 'SERVICE_PACK',
  mainImage: 'https://cdn.nexus.com/images/screen-a54.webp',
  gallery: ['https://cdn.nexus.com/images/screen-a54-back.webp'],
  productImages: [],
  b2cPriceDzd: 89.99,
  b2cSalePriceDzd: null,
  effectivePriceDzd: 89.99,
  isOnSale: false,
  stockQuantity: 15,
  availableStock: 15,
  isAvailable: true,
  isFeatured: true,
  createdAt: '2026-09-01T10:00:00Z',
  shortDescription: 'Module écran OLED premium avec nappe de connexion incluse.',
  description: 'Écran de remplacement complet avec technologie OLED garantissant une restitution fidèle des couleurs.',
  weightGrams: 85,
  dimensionsCm: '15.5 x 7.5 x 0.8',
  brand: {
    id: 'brand-01',
    name: 'Samsung Compatible',
    slug: 'samsung-compatible',
    logoUrl: '/brands/samsung.png',
  },
  category: {
    id: 'cat-01',
    name: 'Écrans OLED',
    slug: 'ecrans-oled',
  },
  compatibility: [],
  relatedProducts: [],
};

describe('DRIPIDIN Phase 7: Dynamic SEO Architecture', () => {
  describe('1. Centralized Canonical URL Resolver', () => {
    it('should prioritize buyer-configured canonicalBaseUrl', () => {
      const url = resolveCanonicalBaseUrl({ canonicalBaseUrl: 'https://custom-shop.dz/' });
      assert.strictEqual(url, 'https://custom-shop.dz');
    });

    it('should strip trailing slashes consistently from canonical URLs', () => {
      const canonical = buildCanonicalUrl('/products/screen-oled/', { canonicalBaseUrl: 'https://custom-shop.dz/' });
      assert.strictEqual(canonical, 'https://custom-shop.dz/products/screen-oled');
    });

    it('should guarantee root canonical URL ends with a single slash', () => {
      const canonical = buildCanonicalUrl('/', { canonicalBaseUrl: 'https://custom-shop.dz' });
      assert.strictEqual(canonical, 'https://custom-shop.dz/');
    });

    it('should strip query parameters and hash fragments to prevent duplicate non-canonical variants', () => {
      const canonical = buildCanonicalUrl('/products?page=2&sort=price#specs', {
        canonicalBaseUrl: 'https://custom-shop.dz',
      });
      assert.strictEqual(canonical, 'https://custom-shop.dz/products');
    });

    it('should reject dangerous URL schemes like javascript: or data:', () => {
      const url = resolveCanonicalBaseUrl({ canonicalBaseUrl: 'javascript:alert(1)' });
      assert.notStrictEqual(url, 'javascript:alert(1)');
      assert.ok(url.startsWith('http'));
    });
  });

  describe('2. Dynamic Next.js Metadata Resolvers', () => {
    it('should generate homepage metadata from configured store settings', () => {
      const metadata = resolveHomeMetadata(MOCK_STORE_SETTINGS);
      assert.strictEqual(metadata.title, 'NEXUS — Spécialiste des Pièces pour Téléphones Portables');
      assert.strictEqual(metadata.description, MOCK_STORE_SETTINGS.metaDescription);
      assert.strictEqual(metadata.alternates?.canonical, 'https://nexusphonestore.com/');
      assert.strictEqual(metadata.openGraph?.siteName, 'NEXUS PHONE STORE');
      assert.strictEqual(metadata.openGraph?.url, 'https://nexusphonestore.com/');
      assert.strictEqual(metadata.twitter?.site, '@nexusphone');
      assert.deepStrictEqual(metadata.robots, { index: true, follow: true });
    });

    it('should generate product metadata with dynamic currency formatting and canonical URL', () => {
      const metadata = resolveProductMetadata(MOCK_PRODUCT, MOCK_STORE_SETTINGS);
      // Effective price is 89.99 EUR -> formatted according to EUR settings
      assert.ok(String(metadata.title).includes('Écran OLED Haute Précision A54'));
      assert.ok(String(metadata.title).includes('89,99') || String(metadata.title).includes('89.99'));
      assert.ok(String(metadata.title).includes('€'));
      assert.strictEqual(metadata.alternates?.canonical, 'https://nexusphonestore.com/products/ecran-oled-haute-precision-a54');
      assert.strictEqual((metadata.openGraph as any)?.type, 'article');
      assert.deepStrictEqual(metadata.robots, { index: true, follow: true });
    });

    it('should reflect store-level seoIndexable = false in product metadata', () => {
      const unindexedSettings: StoreSettings = { ...MOCK_STORE_SETTINGS, seoIndexable: false };
      const metadata = resolveProductMetadata(MOCK_PRODUCT, unindexedSettings);
      assert.deepStrictEqual(metadata.robots, { index: false, follow: true });
    });

    it('should generate category metadata with correct title and canonical URL', () => {
      const category = { id: 'c1', name: 'Batteries Li-Ion', slug: 'batteries-li-ion' };
      const metadata = resolveCategoryMetadata(category, MOCK_STORE_SETTINGS);
      assert.strictEqual(metadata.title, 'Batteries Li-Ion');
      assert.strictEqual(metadata.alternates?.canonical, 'https://nexusphonestore.com/categories/batteries-li-ion');
      assert.strictEqual(metadata.openGraph?.siteName, 'NEXUS PHONE STORE');
    });

    it('should generate brand metadata with correct title and canonical URL', () => {
      const brand = { id: 'b1', name: 'Xiaomi', slug: 'xiaomi' };
      const metadata = resolveBrandMetadata(brand, MOCK_STORE_SETTINGS);
      assert.strictEqual(metadata.title, 'Pièces & Accessoires Xiaomi');
      assert.strictEqual(metadata.alternates?.canonical, 'https://nexusphonestore.com/brands/xiaomi');
    });

    it('should strictly set NOINDEX, FOLLOW for search query pages to prevent thin duplicate pages', () => {
      const metadata = resolveSearchMetadata('ecran oled', MOCK_STORE_SETTINGS);
      assert.strictEqual(metadata.title, 'Recherche « ecran oled »');
      assert.strictEqual(metadata.alternates?.canonical, 'https://nexusphonestore.com/search');
      assert.deepStrictEqual(metadata.robots, { index: false, follow: true });
    });

    it('should strictly set NOINDEX, NOFOLLOW for private administrative and checkout routes', () => {
      const metadata = resolvePrivateMetadata('Passer la Commande', MOCK_STORE_SETTINGS);
      assert.strictEqual(metadata.title, 'Passer la Commande | NEXUS PHONE STORE');
      assert.deepStrictEqual(metadata.robots, { index: false, follow: false });
    });
  });

  describe('3. Schema.org / JSON-LD Structured Data Engine', () => {
    it('should build valid WebSite schema with Sitelinks Searchbox', () => {
      const website = buildWebSiteJsonLd(MOCK_STORE_SETTINGS, 'https://nexusphonestore.com');
      assert.strictEqual(website['@context'], 'https://schema.org');
      assert.strictEqual(website['@type'], 'WebSite');
      assert.strictEqual(website.name, 'NEXUS PHONE STORE');
      assert.strictEqual(website.url, 'https://nexusphonestore.com');
      assert.strictEqual(website.potentialAction?.target.urlTemplate, 'https://nexusphonestore.com/search?q={search_term_string}');
    });

    it('should build valid Organization schema with contact points and social channels', () => {
      const org = buildOrganizationJsonLd(MOCK_STORE_SETTINGS, 'https://nexusphonestore.com');
      assert.strictEqual(org['@context'], 'https://schema.org');
      assert.strictEqual(org['@type'], 'Organization');
      assert.strictEqual(org.name, 'NEXUS PHONE STORE');
      assert.strictEqual(org.legalName, 'NEXUS Mobile Tech SAS');
      assert.strictEqual(org.url, 'https://nexusphonestore.com');
      assert.ok(Array.isArray(org.sameAs));
    });

    it('should build valid Product schema with substantiated Offer and configured currency (no fake reviews)', () => {
      const productSchema = buildProductJsonLd(MOCK_PRODUCT, MOCK_STORE_SETTINGS, 'https://nexusphonestore.com');
      assert.strictEqual(productSchema['@context'], 'https://schema.org');
      assert.strictEqual(productSchema['@type'], 'Product');
      assert.strictEqual(productSchema.name, MOCK_PRODUCT.name);
      assert.strictEqual(productSchema.sku, 'SCR-OLED-A54');
      assert.strictEqual(productSchema.brand?.name, 'Samsung Compatible');

      // Offer verification
      assert.strictEqual(productSchema.offers['@type'], 'Offer');
      assert.strictEqual(productSchema.offers.priceCurrency, 'EUR');
      assert.strictEqual(productSchema.offers.price, 89.99);
      assert.strictEqual(productSchema.offers.availability, 'https://schema.org/InStock');
      assert.strictEqual(productSchema.offers.seller?.name, 'NEXUS PHONE STORE');

      // Verify absence of fabricated claims
      assert.strictEqual((productSchema as any).aggregateRating, undefined);
      assert.strictEqual((productSchema as any).review, undefined);
    });

    it('should correctly mark out-of-stock products in Offer schema', () => {
      const outOfStockProduct: PublicProductDetail = {
        ...MOCK_PRODUCT,
        availableStock: 0,
        stockQuantity: 0,
      };
      const productSchema = buildProductJsonLd(outOfStockProduct, MOCK_STORE_SETTINGS, 'https://nexusphonestore.com');
      assert.strictEqual(productSchema.offers.availability, 'https://schema.org/OutOfStock');
    });

    it('should build hierarchical BreadcrumbList schema with 1-based indexing', () => {
      const breadcrumbs = [
        { name: 'Accueil', url: '/' },
        { name: 'Écrans OLED', url: '/categories/ecrans-oled' },
        { name: 'Écran OLED A54', url: '/products/ecran-oled-haute-precision-a54' },
      ];
      const schema = buildBreadcrumbJsonLd(breadcrumbs, 'https://nexusphonestore.com');
      assert.strictEqual(schema['@context'], 'https://schema.org');
      assert.strictEqual(schema['@type'], 'BreadcrumbList');
      assert.strictEqual(schema.itemListElement.length, 3);
      assert.strictEqual(schema.itemListElement[0].position, 1);
      assert.strictEqual(schema.itemListElement[0].name, 'Accueil');
      assert.strictEqual(schema.itemListElement[0].item, 'https://nexusphonestore.com/');
      assert.strictEqual(schema.itemListElement[1].position, 2);
      assert.strictEqual(schema.itemListElement[1].name, 'Écrans OLED');
      assert.strictEqual(schema.itemListElement[1].item, 'https://nexusphonestore.com/categories/ecrans-oled');
    });

    it('should safely escape < to prevent XSS script injection via serializeJsonLd', () => {
      const maliciousData = {
        name: 'Normal Product</script><script>alert("XSS")</script>',
        description: 'Testing <img src=x onerror=alert(1)>',
      };
      const serialized = serializeJsonLd(maliciousData);
      assert.ok(!serialized.includes('<script>'));
      assert.ok(!serialized.includes('</script>'));
      assert.ok(serialized.includes('\\u003cscript>'));
      assert.ok(serialized.includes('\\u003c/script>'));
    });
  });

  describe('4. SEO Configuration Input Validation (SeoSettingsSchema)', () => {
    it('should accept valid HTTP and HTTPS canonical URLs and strip trailing slashes', () => {
      const result = SeoSettingsSchema.safeParse({
        canonicalBaseUrl: 'https://mystore.com/',
        twitterHandle: '@mystore',
        seoIndexable: true,
        seoFollowLinks: true,
      });
      assert.ok(result.success);
      if (result.success) {
        assert.strictEqual(result.data.canonicalBaseUrl, 'https://mystore.com');
        assert.strictEqual(result.data.twitterHandle, '@mystore');
      }
    });

    it('should auto-prefix twitter handle with @ if omitted', () => {
      const result = SeoSettingsSchema.safeParse({
        twitterHandle: 'mystore',
      });
      assert.ok(result.success);
      if (result.success) {
        assert.strictEqual(result.data.twitterHandle, '@mystore');
      }
    });

    it('should reject dangerous URL schemes in canonicalBaseUrl', () => {
      const result = SeoSettingsSchema.safeParse({
        canonicalBaseUrl: 'javascript:alert(1)',
      });
      assert.strictEqual(result.success, false);
    });

    it('should reject invalid twitter handle formats', () => {
      const result = SeoSettingsSchema.safeParse({
        twitterHandle: '@invalid handle with spaces',
      });
      assert.strictEqual(result.success, false);
    });

    it('should enforce reasonable length constraints on meta fields', () => {
      const result = SeoSettingsSchema.safeParse({
        metaTitle: 'A'.repeat(125), // max is 120
      });
      assert.strictEqual(result.success, false);
    });
  });

  describe('5. White-Label Invariant Assurance', () => {
    it('should have zero runtime references to HamzaPhone in generated metadata or JSON-LD', () => {
      const homeMetadata = resolveHomeMetadata(MOCK_STORE_SETTINGS);
      const productMetadata = resolveProductMetadata(MOCK_PRODUCT, MOCK_STORE_SETTINGS);
      const categoryMetadata = resolveCategoryMetadata({ name: 'Écrans', slug: 'ecrans' }, MOCK_STORE_SETTINGS);
      const brandMetadata = resolveBrandMetadata({ name: 'Samsung', slug: 'samsung' }, MOCK_STORE_SETTINGS);
      const productJsonLd = buildProductJsonLd(MOCK_PRODUCT, MOCK_STORE_SETTINGS, 'https://nexusphonestore.com');

      const allStrings = [
        JSON.stringify(homeMetadata),
        JSON.stringify(productMetadata),
        JSON.stringify(categoryMetadata),
        JSON.stringify(brandMetadata),
        JSON.stringify(productJsonLd),
      ].join(' ');

      assert.ok(!allStrings.toLowerCase().includes('hamzaphone'), 'Found legacy HamzaPhone reference in SEO output');
    });

    it('should dynamically adapt currency in Product schema when store currency is USD', () => {
      const usdSettings: StoreSettings = {
        ...MOCK_STORE_SETTINGS,
        currencyCode: 'USD',
        currencySymbol: '$',
        currencyDecimals: 2,
        currencyPosition: 'BEFORE',
      };
      const schema = buildProductJsonLd(MOCK_PRODUCT, usdSettings, 'https://nexusphonestore.com');
      assert.strictEqual(schema.offers.priceCurrency, 'USD');
    });
  });
});
