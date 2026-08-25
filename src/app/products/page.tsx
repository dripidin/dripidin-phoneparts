// HamzaPhone Product Catalog Page (PLP) with Server-Side Filtering & Pagination

import React from 'react';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CatalogView } from '@/components/storefront/catalog/catalog-view';
import type { ProductType } from '@/types/database.types';

export const metadata: Metadata = {
  title: 'Catalogue des Pièces Détachées Smartphones en Algérie',
  description: 'Trouvez toutes les pièces de rechange pour smartphone (Samsung, iPhone, Xiaomi, Oppo) avec compatibilité garantie et livraison 58 Wilayas.',
};

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    brand?: string;
    productType?: ProductType;
    inStock?: string;
    isFeatured?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    sortBy?: 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
    page?: string;
  }>;
}

export default async function ProductsPage(props: ProductsPageProps) {
  const searchParams = await props.searchParams;
  const supabase = createServerClient();
  const service = new StorefrontService(supabase);

  const page = searchParams.page ? parseInt(searchParams.page, 10) : 1;
  const pageSize = 24;

  const [productsRes, categories, brands] = await Promise.all([
    service.getProducts({
      categorySlug: searchParams.category,
      brandSlug: searchParams.brand,
      productType: searchParams.productType,
      inStockOnly: searchParams.inStock === 'true',
      isFeatured: searchParams.isFeatured === 'true',
      minPriceDzd: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPriceDzd: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      search: searchParams.search,
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
      />
    </StorefrontShell>
  );
}
