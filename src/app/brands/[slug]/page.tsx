// HamzaPhone Brand Listing Page (PLP)

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CatalogView } from '@/components/storefront/catalog/catalog-view';

interface BrandPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    category?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    page?: string;
  }>;
}

export async function generateMetadata(props: BrandPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createServerClient();
  const service = new StorefrontService(supabase);
  const brands = await service.getBrands();
  const brand = brands.find((b) => b.slug === slug);

  if (!brand) {
    return { title: 'Marque non trouvée | HamzaPhone' };
  }

  return {
    title: `Pièces Détachées ${brand.name} — Algérie (58 Wilayas)`,
    description: `Catalogue complet des pièces de rechange pour smartphones ${brand.name} (Écrans, Batteries, Connecteurs, Caméras). Livraison express en Algérie.`,
  };
}

export default async function BrandPage(props: BrandPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const supabase = createServerClient();
  const service = new StorefrontService(supabase);

  const brands = await service.getBrands();
  const currentBrand = brands.find((b) => b.slug === slug);

  if (!currentBrand) {
    notFound();
  }

  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const pageSize = 24;

  const [productsRes, categories] = await Promise.all([
    service.getProducts({
      brandSlug: slug,
      categorySlug: searchParams.category,
      inStockOnly: searchParams.inStock === 'true',
      minPriceDzd: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPriceDzd: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      sortBy: searchParams.sortBy || 'featured',
      page,
      pageSize,
    }),
    service.getCategories(),
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
        pageTitle={`Pièces Détachées ${currentBrand.name}`}
        pageSubtitle={`Tous les composants, écrans et batteries compatibles pour téléphones ${currentBrand.name}.`}
      />
    </StorefrontShell>
  );
}
