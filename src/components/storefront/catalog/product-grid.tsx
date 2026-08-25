'use client';

// HamzaPhone Responsive Product Grid with Loading Skeletons & Empty States

import React from 'react';
import Link from 'next/link';
import { PackageOpen, RefreshCw, ArrowRight } from 'lucide-react';
import type { PublicProductSummary } from '@/lib/services/storefront.service';
import { ProductCard } from './product-card';

interface ProductGridProps {
  products: PublicProductSummary[];
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export function ProductGrid({
  products,
  isLoading = false,
  onResetFilters,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 animate-pulse space-y-3"
          >
            <div className="aspect-square w-full bg-gray-100 rounded-xl" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <div className="h-5 bg-gray-100 rounded w-20" />
              <div className="h-8 bg-gray-100 rounded-xl w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-12 text-center my-6 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
          Aucun produit trouvé
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mb-6">
          Nous n&apos;avons trouvé aucune pièce correspondant à vos critères de recherche ou filtres actuels.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réinitialiser les filtres
            </button>
          )}
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
          >
            Voir tout le catalogue
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {products.map((product, idx) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          priority={idx < 4}
        />
      ))}
    </div>
  );
}
