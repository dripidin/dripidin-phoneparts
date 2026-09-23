// DRIPIDIN Structured Data / JSON-LD Engine
// Generates Schema.org compliant structured data for WebSite, Organization, Product, Offer, and BreadcrumbList.
// Safely escapes user-controlled markup to strictly prevent XSS.

import type { StoreSettings } from '@/types/settings.types';
import type { PublicProductDetail } from '@/lib/services/storefront.service';
import type {
  BreadcrumbItem,
  JsonLdWebsite,
  JsonLdOrganization,
  JsonLdProduct,
  JsonLdBreadcrumbList,
} from './types';
import { buildCanonicalUrl } from './canonical';

/**
 * XSS-Safe JSON-LD stringifier.
 * Escapes '<' to '\u003c' to prevent script breakout attacks inside <script type="application/ld+json">.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Generates Schema.org/WebSite structured data with Sitelinks Searchbox specification.
 */
export function buildWebSiteJsonLd(settings: StoreSettings, baseUrl: string): JsonLdWebsite {
  const storeName = settings.storeName || 'DRIPIDIN';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: storeName,
    url: baseUrl,
    description: settings.metaDescription || settings.tagline || undefined,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generates Schema.org/Organization structured data for the merchant identity.
 */
export function buildOrganizationJsonLd(settings: StoreSettings, baseUrl: string): JsonLdOrganization {
  const storeName = settings.storeName || 'DRIPIDIN';
  const socialLinks = [
    settings.facebookUrl,
    settings.instagramUrl,
    settings.tiktokUrl,
    settings.youtubeUrl,
    settings.telegramUrl,
  ].filter((url): url is string => Boolean(url && url.trim().length > 0));

  const logoUrl = settings.logoUrl
    ? settings.logoUrl.startsWith('http')
      ? settings.logoUrl
      : `${baseUrl}${settings.logoUrl.startsWith('/') ? '' : '/'}${settings.logoUrl}`
    : undefined;

  const org: JsonLdOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: storeName,
    legalName: settings.legalName || undefined,
    url: baseUrl,
    logo: logoUrl,
    sameAs: socialLinks.length > 0 ? socialLinks : undefined,
  };

  if (settings.supportPhone || settings.supportEmail) {
    org.contactPoint = {
      '@type': 'ContactPoint',
      telephone: settings.supportPhone || '',
      contactType: 'customer service',
      email: settings.supportEmail || undefined,
      availableLanguage: [settings.defaultLocale || 'fr-DZ'],
    };
  }

  return org;
}

/**
 * Generates Schema.org/Product structured data with substantiated Offer pricing.
 * Strictly avoids fake reviews, ratings, or fabricated availability claims.
 */
export function buildProductJsonLd(
  product: PublicProductDetail,
  settings: StoreSettings,
  baseUrl: string
): JsonLdProduct {
  const canonicalProductUrl = buildCanonicalUrl(`/products/${product.slug}`, settings);

  // Collect unique image URLs
  const rawImages = [
    product.mainImage,
    ...(Array.isArray(product.gallery) ? product.gallery : []),
    ...(Array.isArray(product.productImages) ? product.productImages.map((img) => img.imageUrl) : []),
  ].filter(Boolean);

  const images = (rawImages.length > 0 ? Array.from(new Set(rawImages)) : ['/images/placeholder-product.webp']).map(
    (img) => (img.startsWith('http') ? img : `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`)
  );

  const isAvailable = (product.availableStock ?? 0) > 0 && product.isAvailable !== false;
  const currency = (settings.currencyCode || 'DZD').trim().toUpperCase();

  const productSchema: JsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description: product.description || product.shortDescription || product.name,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      url: canonicalProductUrl,
      priceCurrency: currency,
      price: product.effectivePriceDzd || product.b2cPriceDzd || 0,
      availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: settings.storeName || 'DRIPIDIN',
      },
    },
  };

  if (product.brand?.name) {
    productSchema.brand = {
      '@type': 'Brand',
      name: product.brand.name,
    };
  }

  return productSchema;
}

/**
 * Generates Schema.org/BreadcrumbList structured data for hierarchical navigation.
 */
export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], baseUrl: string): JsonLdBreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const itemUrl = item.url.startsWith('http')
        ? item.url
        : `${baseUrl}${item.url.startsWith('/') ? '' : '/'}${item.url}`;
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: itemUrl,
      };
    }),
  };
}
