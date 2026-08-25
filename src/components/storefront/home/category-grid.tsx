'use client';

// HamzaPhone Visual Category Cards Grid

import React from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  Battery, 
  Zap, 
  Camera, 
  Layers, 
  Cpu, 
  Wrench, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

const CATEGORY_ICONS: Record<string, any> = {
  'ecrans-afficheurs': Smartphone,
  'batteries': Battery,
  'connecteurs-charge': Zap,
  'cameras-capteurs': Camera,
  'vitres-chassis': Layers,
  'nappes-composants': Cpu,
  'outils-consommables': Wrench,
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="space-y-4 py-4">
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catalogue par pièce</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
            Catégories Principales
          </h2>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
        >
          <span>Toutes les catégories</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug] || Smartphone;
          return (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="group bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 hover:border-orange-500 hover:shadow-lg transition-all flex flex-col justify-between space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-2xs">
                <Icon className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                  Voir les pièces disponibles →
                </p>
              </div>
            </Link>
          );
        })}
      </div>

    </section>
  );
}
