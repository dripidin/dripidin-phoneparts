'use server';

// HamzaPhone Storefront Server Actions: Public Catalog, Instant Search, Facets & Slug Resolution

import { createServerClient } from '@/lib/auth/server';
import { StorefrontService, type StorefrontCatalogParams } from '@/lib/services/storefront.service';

export async function getStorefrontHomepageData() {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  return service.getHomepageData();
}

export async function getStorefrontProductsAction(params: StorefrontCatalogParams = {}) {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  return service.getProducts(params);
}

export async function getProductBySlugAction(slug: string) {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  return service.getProductBySlug(slug);
}

export async function getInstantSearchSuggestionsAction(query: string) {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  return service.getInstantSearchSuggestions(query);
}

export async function getStorefrontCategoriesAction() {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  return service.getCategories();
}

export async function getStorefrontBrandsAction() {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  return service.getBrands();
}
