'use client';

// HamzaPhone Interactive Catalog View Controller

import React, { useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SlidersHorizontal, Package, Sparkles } from 'lucide-react';
import type { PublicProductSummary, StorefrontCatalogParams } from '@/lib/services/storefront.service';
import type { ProductType } from '@/types/database.types';
import { FilterSidebar, type FilterState } from './filter-sidebar';
import { FilterDrawer } from './filter-drawer';
import { ActiveFilters } from './active-filters';
import { SortDropdown } from './sort-dropdown';
import { ProductGrid } from './product-grid';
import { Pagination } from './pagination';

interface CatalogViewProps {
  initialProducts: PublicProductSummary[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  pageTitle?: string;
  pageSubtitle?: string;
}

export function CatalogView({
  initialProducts,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  categories,
  brands,
  pageTitle = 'Catalogue des Pièces Détachées',
  pageSubtitle = 'Écrans OLED, batteries, connecteurs et pièces certifiées disponibles en stock.',
}: CatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Parse filters from URL
  const currentFilters: FilterState = {
    categorySlug: searchParams.get('category') || undefined,
    brandSlug: searchParams.get('brand') || undefined,
    productType: (searchParams.get('productType') as ProductType) || undefined,
    inStockOnly: searchParams.get('inStock') === 'true' || undefined,
    minPriceDzd: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPriceDzd: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
  };

  const currentSort = (searchParams.get('sortBy') as StorefrontCatalogParams['sortBy']) || 'featured';
  const searchQuery = searchParams.get('search') || undefined;

  // Helper to update URL search params
  const updateUrlParams = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    updateUrlParams({
      category: newFilters.categorySlug,
      brand: newFilters.brandSlug,
      productType: newFilters.productType,
      inStock: newFilters.inStockOnly ? 'true' : undefined,
      minPrice: newFilters.minPriceDzd ? String(newFilters.minPriceDzd) : undefined,
      maxPrice: newFilters.maxPriceDzd ? String(newFilters.maxPriceDzd) : undefined,
      page: '1', // Reset to page 1 on filter change
    });
  };

  const handleRemoveFilter = (key: keyof FilterState) => {
    const nextFilters = { ...currentFilters, [key]: undefined };
    handleFilterChange(nextFilters);
  };

  const handleClearAll = () => {
    updateUrlParams({
      category: undefined,
      brand: undefined,
      productType: undefined,
      inStock: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      search: undefined,
      page: '1',
    });
  };

  const handleSortChange = (sort: StorefrontCatalogParams['sortBy']) => {
    updateUrlParams({ sortBy: sort, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateUrlParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCategory = categories.find((c) => c.slug === currentFilters.categorySlug);
  const activeBrand = brands.find((b) => b.slug === currentFilters.brandSlug);

  const activeFilterCount = Object.values(currentFilters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600">
              <Sparkles className="w-4 h-4" />
              <span>Stock Réel Algérie</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900">
              {activeCategory ? activeCategory.name : activeBrand ? `Pièces ${activeBrand.name}` : pageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              {searchQuery ? `Résultats de recherche pour « ${searchQuery} »` : pageSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold bg-orange-50 text-orange-700 px-3 py-1.5 rounded-xl border border-orange-200">
              {totalCount} pièce{totalCount > 1 ? 's' : ''} trouvée{totalCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Controls Row: Active Filters, Mobile Filter Button & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        
        {/* Mobile Filter Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtres {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>

          <span className="text-xs text-gray-500 font-medium hidden lg:inline">
            Filtres et options de tri :
          </span>
        </div>

        {/* Sort Selector */}
        <SortDropdown value={currentSort} onChange={handleSortChange} />
      </div>

      {/* Active Filter Chips */}
      <ActiveFilters
        filters={currentFilters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAll}
        categoryName={activeCategory?.name}
        brandName={activeBrand?.name}
      />

      {/* 3. Main Catalog Grid & Sidebar */}
      <div className="flex items-start gap-6">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={currentFilters}
            onFilterChange={handleFilterChange}
            categories={categories}
            brands={brands}
            onClearAll={handleClearAll}
          />
        </div>

        {/* Product Grid & Pagination */}
        <div className="flex-1 min-w-0">
          <ProductGrid
            products={initialProducts}
            onResetFilters={handleClearAll}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>

      </div>

      {/* Mobile Filter Drawer */}
      <FilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        categories={categories}
        brands={brands}
        onClearAll={handleClearAll}
      />

    </div>
  );
}
