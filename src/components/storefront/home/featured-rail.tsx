'use client';

// HamzaPhone Reusable Featured & New Arrivals Products Rail

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Flame } from 'lucide-react';
import type { PublicProductSummary } from '@/lib/services/storefront.service';
import { ProductCard } from '@/components/storefront/catalog/product-card';

interface FeaturedRailProps {
  title: string;
  subtitle?: string;
  products: PublicProductSummary[];
  viewAllHref?: string;
  badgeText?: string;
  isHot?: boolean;
}

export function FeaturedRail({
  title,
  subtitle,
  products,
  viewAllHref = '/products',
  badgeText = 'Sélection',
  isHot = false,
}: FeaturedRailProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
            {isHot ? <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{badgeText}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-500 hidden sm:block">{subtitle}</p>
          )}
        </div>

        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          <span>Voir tout</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {products.slice(0, 8).map((p, idx) => (
          <ProductCard key={p.id} product={p} priority={idx < 4} />
        ))}
      </div>
    </section>
  );
}
