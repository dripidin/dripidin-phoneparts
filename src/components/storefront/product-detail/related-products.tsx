'use client';

// HamzaPhone Related Products Rail

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { PublicProductSummary } from '@/lib/services/storefront.service';
import { ProductCard } from '@/components/storefront/catalog/product-card';

interface RelatedProductsProps {
  products: PublicProductSummary[];
  categoryName?: string;
}

export function RelatedProducts({ products, categoryName }: RelatedProductsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Pièces Similaires & Recommandées
            </h3>
            <p className="text-xs text-gray-500">
              D&apos;autres composants {categoryName ? `dans ${categoryName}` : 'pour votre modèle'}
            </p>
          </div>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          Voir plus
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
