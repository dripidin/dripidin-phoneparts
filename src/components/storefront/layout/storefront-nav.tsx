'use client';

// HamzaPhone Storefront Category & Brand Navigation Bar

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FolderTree, 
  ChevronDown, 
  Smartphone, 
  Battery, 
  Cpu, 
  Zap, 
  Wrench, 
  Layers, 
  Tag,
  Flame,
  Camera
} from 'lucide-react';
import { useStorefrontCategories, useStorefrontBrands } from '@/lib/hooks/use-storefront-queries';

export function StorefrontNav() {
  const { data: categories = [] } = useStorefrontCategories();
  const { data: brands = [] } = useStorefrontBrands();
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const popularCategoryShortcuts = [
    { name: 'Écrans & Afficheurs', slug: 'ecrans-afficheurs', icon: Smartphone },
    { name: 'Batteries', slug: 'batteries', icon: Battery },
    { name: 'Connecteurs de Charge', slug: 'connecteurs-charge', icon: Zap },
    { name: 'Caméras & Capteurs', slug: 'cameras-capteurs', icon: Camera },
    { name: 'Vitres & Châssis', slug: 'vitres-chassis', icon: Layers },
    { name: 'Nappes & Composants', slug: 'nappes-composants', icon: Cpu },
    { name: 'Outils Réparation', slug: 'outils-consommables', icon: Wrench },
  ];

  return (
    <nav className="hidden lg:block bg-white border-b border-gray-100 text-xs font-semibold text-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left Side: All Categories & Brand Shortcuts */}
        <div className="flex items-center gap-1">
          
          {/* All Categories Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setShowCatDropdown(true)}
            onMouseLeave={() => setShowCatDropdown(false)}
          >
            <button
              className={`flex items-center gap-2 px-4 py-3 font-bold transition-colors ${
                showCatDropdown 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-gray-900 hover:text-orange-600'
              }`}
            >
              <FolderTree className="w-4 h-4 text-orange-500" />
              <span>Toutes les Pièces</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCatDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showCatDropdown && (
              <div className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                  Catégories principales
                </div>
                <div className="space-y-0.5">
                  {categories.map((cat: any) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      onClick={() => setShowCatDropdown(false)}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">→</span>
                    </Link>
                  ))}
                  <div className="pt-2 mt-1 border-t border-gray-100">
                    <Link
                      href="/products"
                      className="block px-3 py-2 rounded-xl text-xs font-bold text-orange-600 hover:bg-orange-50 text-center transition-colors"
                      onClick={() => setShowCatDropdown(false)}
                    >
                      Voir tout le catalogue (4 000+ réf)
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Category Tabs */}
          {popularCategoryShortcuts.slice(0, 5).map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.slug}
                href={`/categories/${shortcut.slug}`}
                className="flex items-center gap-1.5 px-3 py-3 rounded-lg text-gray-600 hover:text-orange-600 hover:bg-gray-50 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span>{shortcut.name}</span>
              </Link>
            );
          })}

          {/* Brands Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setShowBrandDropdown(true)}
            onMouseLeave={() => setShowBrandDropdown(false)}
          >
            <button
              className={`flex items-center gap-1.5 px-3 py-3 rounded-lg transition-colors ${
                showBrandDropdown ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span>Marques</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showBrandDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showBrandDropdown && (
              <div className="absolute top-full left-0 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1.5">
                  Fabricants smartphones
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {brands.map((b: any) => (
                    <Link
                      key={b.id}
                      href={`/brands/${b.slug}`}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors text-center"
                      onClick={() => setShowBrandDropdown(false)}
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Special Offers & Catalog link */}
        <div className="flex items-center gap-3">
          <Link
            href="/products?isFeatured=true"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 font-bold hover:bg-orange-100 transition-colors"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>Nouveautés & Promos</span>
          </Link>
        </div>

      </div>
    </nav>
  );
}
