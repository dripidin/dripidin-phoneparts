// TanStack Query Hooks for HamzaPhone Storefront Data Layer

import { useQuery } from '@tanstack/react-query';
import {
  getStorefrontHomepageData,
  getStorefrontProductsAction,
  getProductBySlugAction,
  getInstantSearchSuggestionsAction,
  getStorefrontCategoriesAction,
  getStorefrontBrandsAction,
} from '@/lib/actions/storefront.actions';
import type { StorefrontCatalogParams } from '@/lib/services/storefront.service';

export const storefrontQueryKeys = {
  homepage: ['storefront', 'homepage'] as const,
  products: (params: StorefrontCatalogParams) => ['storefront', 'products', params] as const,
  productDetail: (slug: string) => ['storefront', 'product', slug] as const,
  instantSearch: (query: string) => ['storefront', 'search', query] as const,
  categories: ['storefront', 'categories'] as const,
  brands: ['storefront', 'brands'] as const,
};

export function useStorefrontHomepage() {
  return useQuery({
    queryKey: storefrontQueryKeys.homepage,
    queryFn: () => getStorefrontHomepageData(),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useStorefrontProducts(params: StorefrontCatalogParams = {}) {
  return useQuery({
    queryKey: storefrontQueryKeys.products(params),
    queryFn: () => getStorefrontProductsAction(params),
    staleTime: 30 * 1000,
  });
}

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: storefrontQueryKeys.productDetail(slug),
    queryFn: () => getProductBySlugAction(slug),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });
}

export function useInstantSearch(query: string, enabled: boolean = true) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: storefrontQueryKeys.instantSearch(trimmed),
    queryFn: () => getInstantSearchSuggestionsAction(trimmed),
    enabled: enabled && trimmed.length >= 2,
    staleTime: 20 * 1000,
  });
}

export function useStorefrontCategories() {
  return useQuery({
    queryKey: storefrontQueryKeys.categories,
    queryFn: () => getStorefrontCategoriesAction(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStorefrontBrands() {
  return useQuery({
    queryKey: storefrontQueryKeys.brands,
    queryFn: () => getStorefrontBrandsAction(),
    staleTime: 5 * 60 * 1000,
  });
}
