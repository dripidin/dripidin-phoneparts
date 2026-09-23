// DRIPIDIN Centralized Next.js Metadata API Resolver
// Provides composable, white-label metadata generation for storefront routes.
// Decoupled from hardcoded currencies, outdated domains, or specific country assumptions.

import type { Metadata } from 'next';
import type { StoreSettings } from '@/types/settings.types';
import type { PublicProductDetail } from '@/lib/services/storefront.service';
import type { CategorySeoData, BrandSeoData } from './types';
import { resolveCanonicalBaseUrl, buildCanonicalUrl } from './canonical';
import { MoneyFormatter } from '@/lib/money/formatter';

/**
 * Builds standard OpenGraph images array with absolute URL resolution.
 */
function resolveOgImages(
  customImage: string | undefined | null,
  settings: StoreSettings,
  baseUrl: string
): Array<{ url: string; alt?: string }> {
  const chosen = customImage || settings.ogImageUrl || '/og-image.jpg';
  const fullUrl = chosen.startsWith('http') ? chosen : `${baseUrl}${chosen.startsWith('/') ? '' : '/'}${chosen}`;
  return [{ url: fullUrl, alt: settings.storeName || 'DRIPIDIN' }];
}

/**
 * Resolves standard Twitter card configuration.
 */
function resolveTwitterCard(
  title: string,
  description: string,
  images: Array<{ url: string }>,
  settings: StoreSettings
): Metadata['twitter'] {
  const handle = settings.twitterHandle?.trim() || undefined;
  return {
    card: 'summary_large_image',
    title,
    description,
    images: images.map((i) => i.url),
    site: handle,
    creator: handle,
  };
}

/**
 * 1. Root / Homepage Metadata Resolver
 */
export function resolveHomeMetadata(settings: StoreSettings): Metadata {
  const baseUrl = resolveCanonicalBaseUrl(settings);
  const storeName = settings.storeName || 'DRIPIDIN';
  const title = settings.metaTitle || `${storeName} — ${settings.tagline || 'Boutique en ligne'}`;
  const description =
    settings.metaDescription ||
    settings.tagline ||
    `Bienvenue sur la boutique en ligne officielle de ${storeName}. Vente en ligne, livraison rapide et service client dédié.`;

  const canonicalUrl = buildCanonicalUrl('/', settings);
  const ogImages = resolveOgImages(settings.ogImageUrl, settings, baseUrl);

  const keywords = settings.metaKeywords
    ? settings.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [storeName.toLowerCase(), 'e-commerce', 'boutique en ligne'];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: settings.seoIndexable,
      follow: settings.seoFollowLinks,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: storeName,
      locale: settings.defaultLocale ? settings.defaultLocale.replace('-', '_') : 'fr_DZ',
      type: 'website',
      images: ogImages,
    },
    twitter: resolveTwitterCard(title, description, ogImages, settings),
  };
}

/**
 * 2. Public Catalog Page (/products) Metadata Resolver
 */
export function resolveCatalogMetadata(settings: StoreSettings): Metadata {
  const baseUrl = resolveCanonicalBaseUrl(settings);
  const storeName = settings.storeName || 'DRIPIDIN';
  const title = `Catalogue des Produits`;
  const description = `Découvrez tous les produits et références disponibles sur la boutique ${storeName}. Tarifs actualisés et disponibilité en stock.`;
  const canonicalUrl = buildCanonicalUrl('/products', settings);
  const ogImages = resolveOgImages(undefined, settings, baseUrl);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: settings.seoIndexable,
      follow: settings.seoFollowLinks,
    },
    openGraph: {
      title: `${title} | ${storeName}`,
      description,
      url: canonicalUrl,
      siteName: storeName,
      locale: settings.defaultLocale ? settings.defaultLocale.replace('-', '_') : 'fr_DZ',
      type: 'website',
      images: ogImages,
    },
    twitter: resolveTwitterCard(`${title} | ${storeName}`, description, ogImages, settings),
  };
}

/**
 * 3. Public Product Detail Page (/products/[slug]) Metadata Resolver
 */
export function resolveProductMetadata(product: PublicProductDetail, settings: StoreSettings): Metadata {
  const baseUrl = resolveCanonicalBaseUrl(settings);
  const storeName = settings.storeName || 'DRIPIDIN';

  const effectivePrice = product.effectivePriceDzd || product.b2cPriceDzd || 0;
  const formattedPrice = MoneyFormatter.format(effectivePrice, {
    currencyCode: settings.currencyCode,
    currencySymbol: settings.currencySymbol,
    decimals: settings.currencyDecimals,
    position: settings.currencyPosition,
    spaceSeparated: settings.currencySpaceSeparated,
    locale: settings.defaultLocale,
  });

  const title = `${product.name} (${product.sku}) — ${formattedPrice}`;
  const description =
    product.shortDescription ||
    product.description ||
    `Commandez ${product.name} au meilleur tarif (${formattedPrice}) sur ${storeName}. Pièce testée et garantie.`;

  const canonicalUrl = buildCanonicalUrl(`/products/${product.slug}`, settings);
  const ogImages = resolveOgImages(product.mainImage, settings, baseUrl);

  const isIndexable = settings.seoIndexable && product.isAvailable !== false;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: isIndexable,
      follow: settings.seoFollowLinks,
    },
    openGraph: {
      title: `${title} | ${storeName}`,
      description,
      url: canonicalUrl,
      siteName: storeName,
      locale: settings.defaultLocale ? settings.defaultLocale.replace('-', '_') : 'fr_DZ',
      type: 'article',
      images: ogImages,
    },
    twitter: resolveTwitterCard(`${title} | ${storeName}`, description, ogImages, settings),
  };
}

/**
 * 4. Public Category Page (/categories/[slug]) Metadata Resolver
 */
export function resolveCategoryMetadata(category: CategorySeoData, settings: StoreSettings): Metadata {
  const baseUrl = resolveCanonicalBaseUrl(settings);
  const storeName = settings.storeName || 'DRIPIDIN';
  const title = `${category.name}`;
  const description =
    category.description ||
    `Consultez notre sélection complète pour la catégorie ${category.name} sur ${storeName}. Stock certifié et expédition rapide.`;

  const canonicalUrl = buildCanonicalUrl(`/categories/${category.slug}`, settings);
  const ogImages = resolveOgImages(undefined, settings, baseUrl);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: settings.seoIndexable,
      follow: settings.seoFollowLinks,
    },
    openGraph: {
      title: `${title} | ${storeName}`,
      description,
      url: canonicalUrl,
      siteName: storeName,
      locale: settings.defaultLocale ? settings.defaultLocale.replace('-', '_') : 'fr_DZ',
      type: 'website',
      images: ogImages,
    },
    twitter: resolveTwitterCard(`${title} | ${storeName}`, description, ogImages, settings),
  };
}

/**
 * 5. Public Brand Page (/brands/[slug]) Metadata Resolver
 */
export function resolveBrandMetadata(brand: BrandSeoData, settings: StoreSettings): Metadata {
  const baseUrl = resolveCanonicalBaseUrl(settings);
  const storeName = settings.storeName || 'DRIPIDIN';
  const title = `Pièces & Accessoires ${brand.name}`;
  const description =
    brand.description ||
    `Catalogue complet des pièces de rechange et accessoires compatibles ${brand.name} sur ${storeName}.`;

  const canonicalUrl = buildCanonicalUrl(`/brands/${brand.slug}`, settings);
  const ogImages = resolveOgImages(brand.logoUrl, settings, baseUrl);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: settings.seoIndexable,
      follow: settings.seoFollowLinks,
    },
    openGraph: {
      title: `${title} | ${storeName}`,
      description,
      url: canonicalUrl,
      siteName: storeName,
      locale: settings.defaultLocale ? settings.defaultLocale.replace('-', '_') : 'fr_DZ',
      type: 'website',
      images: ogImages,
    },
    twitter: resolveTwitterCard(`${title} | ${storeName}`, description, ogImages, settings),
  };
}

/**
 * 6. Storefront Search Results Metadata Resolver
 * Strictly tags search parameter variations as NOINDEX to avoid duplicate thin content, while preserving link following.
 */
export function resolveSearchMetadata(query: string, settings: StoreSettings): Metadata {
  const storeName = settings.storeName || 'DRIPIDIN';
  const title = query ? `Recherche « ${query} »` : 'Recherche de pièces';
  const description = `Résultats de recherche pour votre sélection sur ${storeName}.`;
  const canonicalUrl = buildCanonicalUrl('/search', settings);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * 7. Private / Administrative / Transactional Metadata Resolver
 * Enforces strict NOINDEX, NOFOLLOW for cart, checkout, account, and auth pages.
 */
export function resolvePrivateMetadata(title: string, settings?: StoreSettings): Metadata {
  const storeName = settings?.storeName || 'DRIPIDIN';
  return {
    title: `${title} | ${storeName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}
