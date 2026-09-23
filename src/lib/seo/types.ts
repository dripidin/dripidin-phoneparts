// DRIPIDIN Centralized SEO Domain Types & Contracts
// White-label SEO representation decoupled from old project naming or hard-coded assumptions.

import type { StoreSettings } from '@/types/settings.types';
import type { PublicProductDetail } from '@/lib/services/storefront.service';

export interface SeoConfig {
  siteTitle: string;
  siteDescription: string;
  canonicalBaseUrl: string;
  defaultOgImage: string;
  indexable: boolean;
  followLinks: boolean;
  twitterHandle?: string;
  storeName: string;
  currencyCode: string;
  defaultLocale: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface CategorySeoData {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  productCount?: number;
}

export interface BrandSeoData {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
}

export interface JsonLdWebsite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface JsonLdOrganization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  legalName?: string;
  url: string;
  logo?: string;
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone: string;
    contactType: string;
    email?: string;
    availableLanguage?: string[];
  };
  sameAs?: string[];
}

export interface JsonLdProductOffer {
  '@type': 'Offer';
  url: string;
  priceCurrency: string;
  price: number;
  availability: 'https://schema.org/InStock' | 'https://schema.org/OutOfStock';
  itemCondition: 'https://schema.org/NewCondition';
  priceValidUntil?: string;
  seller?: {
    '@type': 'Organization';
    name: string;
  };
}

export interface JsonLdProduct {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  image: string[];
  description: string;
  sku: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers: JsonLdProductOffer;
}

export interface JsonLdBreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}
