// HamzaPhone Category Listing Page (PLP)

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CatalogView } from '@/components/storefront/catalog/catalog-view';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    brand?: string;
    inStock?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    page?: string;
  }>;
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  const categories = await service.getCategories();
  const cat = categories.find((c) => c.slug === slug);

  if (!cat) {
    return { title: 'Catégorie non trouvée | HamzaPhone' };
  }

  return {
    title: `${cat.name} — Pièces Détachées Smartphones Algérie`,
    description: `Achetez vos ${cat.name} en gros et détail en Algérie. Stock réel, pièces 100% testées et livraison rapide 58 Wilayas.`,
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;

  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);

  const categories = await service.getCategories();
  const currentCategory = categories.find((c) => c.slug === slug);

  if (!currentCategory) {
    notFound();
  }

  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const pageSize = 24;

  const [productsRes, brands] = await Promise.all([
    service.getProducts({
      categorySlug: slug,
      brandSlug: searchParams.brand,
      inStockOnly: searchParams.inStock === 'true',
      minPriceDzd: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPriceDzd: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      sortBy: searchParams.sortBy || 'featured',
      page,
      pageSize,
    }),
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
        pageTitle={currentCategory.name}
        pageSubtitle={`Toutes les pièces de la catégorie ${currentCategory.name} disponibles immédiatement en stock.`}
      />
    </StorefrontShell>
  );
}
