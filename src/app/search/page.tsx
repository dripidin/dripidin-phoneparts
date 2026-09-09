// HamzaPhone Search Results Page

import React from 'react';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CatalogView } from '@/components/storefront/catalog/catalog-view';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    search?: string;
    category?: string;
    brand?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    page?: string;
  }>;
}

export async function generateMetadata(props: SearchPageProps): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const q = searchParams.q || searchParams.search || '';

  return {
    title: q ? `Recherche « ${q} » | HamzaPhone Algérie` : 'Recherche de pièces | HamzaPhone',
    description: `Résultats de recherche pour vos pièces détachées smartphones en Algérie.`,
  };
}

export default async function SearchPage(props: SearchPageProps) {
  const searchParams = await props.searchParams;
  const query = searchParams.q || searchParams.search || '';

  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);

  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const pageSize = 24;

  const [productsRes, categories, brands] = await Promise.all([
    service.getProducts({
      search: query,
      categorySlug: searchParams.category,
      brandSlug: searchParams.brand,
      inStockOnly: searchParams.inStock === 'true',
      minPriceDzd: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPriceDzd: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      sortBy: searchParams.sortBy || 'featured',
      page,
      pageSize,
    }),
    service.getCategories(),
    service.getBrands(),
  ]);

  return (
    <StorefrontShell>
      <CatalogView
        initialProducts={productsRes.products}
        totalCount={productsRes.totalCount}
        currentPage={productsRes.page}
        pageSize={productsRes.pageSize}
        totalPages={productsRes.totalPages}
        categories={categories}
        brands={brands}
        pageTitle={query ? `Recherche : « ${query} »` : 'Recherche de Pièces'}
        pageSubtitle={`Trouvez rapidement votre composant parmi nos 4 000+ références en stock.`}
      />
    </StorefrontShell>
  );
}
