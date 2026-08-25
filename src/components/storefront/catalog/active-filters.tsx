'use client';

// HamzaPhone Active Filter Chips Component

import React from 'react';
import { X, RotateCcw } from 'lucide-react';
import type { FilterState } from './filter-sidebar';

interface ActiveFiltersProps {
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState) => void;
  onClearAll: () => void;
  categoryName?: string;
  brandName?: string;
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  categoryName,
  brandName,
}: ActiveFiltersProps) {
  const chips: Array<{ key: keyof FilterState; label: string }> = [];

  if (filters.categorySlug) {
    chips.push({ key: 'categorySlug', label: `Catégorie: ${categoryName || filters.categorySlug}` });
  }
  if (filters.brandSlug) {
    chips.push({ key: 'brandSlug', label: `Marque: ${brandName || filters.brandSlug}` });
  }
  if (filters.productType) {
    chips.push({ key: 'productType', label: `Type: ${filters.productType}` });
  }
  if (filters.inStockOnly) {
    chips.push({ key: 'inStockOnly', label: 'En stock' });
  }
  if (filters.minPriceDzd || filters.maxPriceDzd) {
    const min = filters.minPriceDzd ? `${filters.minPriceDzd.toLocaleString('fr-DZ')} DZD` : '0';
    const max = filters.maxPriceDzd ? `${filters.maxPriceDzd.toLocaleString('fr-DZ')} DZD` : 'max';
    chips.push({ key: 'minPriceDzd', label: `Prix: ${min} - ${max}` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in">
      <span className="text-xs font-semibold text-gray-500">Filtres actifs :</span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold"
        >
          <span>{chip.label}</span>
          <button
            onClick={() => onRemoveFilter(chip.key)}
            className="hover:text-orange-900 transition-colors"
            aria-label={`Supprimer le filtre ${chip.label}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors ml-1"
      >
        <RotateCcw className="w-3 h-3" />
        Tout effacer
      </button>
    </div>
  );
}
