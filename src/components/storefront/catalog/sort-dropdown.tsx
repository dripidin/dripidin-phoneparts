'use client';

// HamzaPhone Storefront Sort Selector

import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { StorefrontCatalogParams } from '@/lib/services/storefront.service';

interface SortDropdownProps {
  value?: StorefrontCatalogParams['sortBy'];
  onChange: (sort: StorefrontCatalogParams['sortBy']) => void;
}

const SORT_OPTIONS: Array<{ value: StorefrontCatalogParams['sortBy']; label: string }> = [
  { value: 'featured', label: 'Recommandés & Populaires' },
  { value: 'newest', label: 'Nouveautés récentes' },
  { value: 'price_asc', label: 'Prix croissant (DZD)' },
  { value: 'price_desc', label: 'Prix décroissant (DZD)' },
  { value: 'name_asc', label: 'Nom alphabétique (A-Z)' },
];

export function SortDropdown({ value = 'featured', onChange }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium hidden sm:inline">Trier par :</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as StorefrontCatalogParams['sortBy'])}
          className="appearance-none bg-white border border-gray-200 text-gray-800 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          aria-label="Trier les résultats"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
