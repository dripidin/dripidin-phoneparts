'use client';

// HamzaPhone Popular Smartphone Brand Logos & Links

import React from 'react';
import Link from 'next/link';
import { Tag, ArrowRight } from 'lucide-react';

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

interface BrandStripProps {
  brands: BrandItem[];
}

export function BrandStrip({ brands }: BrandStripProps) {
  return (
    <section className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
            <Tag className="w-3.5 h-3.5" />
            <span>Fabricants</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
            Marques Prises en Charge
          </h2>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          <span>Toutes les marques</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brands/${b.slug}`}
            className="group bg-white rounded-2xl border border-gray-200/80 p-3 sm:p-4 text-center hover:border-orange-500 hover:shadow-md transition-all flex flex-col items-center justify-center space-y-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-extrabold text-sm text-gray-800 group-hover:bg-orange-500 group-hover:text-white transition-all">
              {b.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-bold text-xs text-gray-900 group-hover:text-orange-600 transition-colors">
              {b.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
