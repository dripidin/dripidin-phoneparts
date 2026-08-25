'use client';

// HamzaPhone Desktop Filter Sidebar: Category, Brand, Product Type, Price & Stock

import React, { useState } from 'react';
import { 
  FolderTree, 
  Tag, 
  Layers, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  X,
  Sparkles
} from 'lucide-react';
import type { ProductType } from '@/types/database.types';

export interface FilterState {
  categorySlug?: string;
  brandSlug?: string;
  productType?: ProductType;
  inStockOnly?: boolean;
  minPriceDzd?: number;
  maxPriceDzd?: number;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  onClearAll: () => void;
}

const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: 'OEM_ORIGINAL', label: 'OEM Original' },
  { value: 'SERVICE_PACK', label: 'Service Pack Officiel' },
  { value: 'REFURBISHED', label: 'Reconditionné Certifié' },
  { value: 'HIGH_COPY', label: 'Haute Qualité (High Copy)' },
  { value: 'AFTERMARKET', label: 'Compatible Aftermarket' },
  { value: 'ACCESSORY', label: 'Accessoires' },
  { value: 'TOOL', label: 'Outils & Tournevis' },
];

export function FilterSidebar({
  filters,
  onFilterChange,
  categories,
  brands,
  onClearAll,
}: FilterSidebarProps) {
  const [minPriceInput, setMinPriceInput] = useState<string>(
    filters.minPriceDzd ? String(filters.minPriceDzd) : ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    filters.maxPriceDzd ? String(filters.maxPriceDzd) : ''
  );

  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    brands: true,
    types: true,
    price: true,
  });

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePriceApply = () => {
    const min = minPriceInput ? Number(minPriceInput) : undefined;
    const max = maxPriceInput ? Number(maxPriceInput) : undefined;
    onFilterChange({
      ...filters,
      minPriceDzd: min,
      maxPriceDzd: max,
    });
  };

  const hasActiveFilters = Boolean(
    filters.categorySlug ||
    filters.brandSlug ||
    filters.productType ||
    filters.inStockOnly ||
    filters.minPriceDzd ||
    filters.maxPriceDzd
  );

  return (
    <aside className="w-64 shrink-0 space-y-5 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
          <SlidersHorizontal className="w-4 h-4 text-orange-500" />
          <span>Filtres</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* 1. In-Stock Switch */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
        <label htmlFor="in-stock-filter" className="text-xs font-bold text-gray-800 flex items-center gap-1.5 cursor-pointer">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>En stock uniquement</span>
        </label>
        <input
          id="in-stock-filter"
          type="checkbox"
          checked={Boolean(filters.inStockOnly)}
          onChange={(e) =>
            onFilterChange({ ...filters, inStockOnly: e.target.checked ? true : undefined })
          }
          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300 cursor-pointer"
        />
      </div>

      {/* 2. Categories Filter */}
      <div className="space-y-2">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 hover:text-orange-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-orange-500" />
            Catégories
          </span>
          {expandedSections.categories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expandedSections.categories && (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => onFilterChange({ ...filters, categorySlug: undefined })}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                !filters.categorySlug
                  ? 'bg-orange-50 font-bold text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>Toutes les catégories</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ ...filters, categorySlug: cat.slug })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  filters.categorySlug === cat.slug
                    ? 'bg-orange-50 font-bold text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Brands Filter */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => toggleSection('brands')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 hover:text-orange-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-orange-500" />
            Marques
          </span>
          {expandedSections.brands ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expandedSections.brands && (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            <button
              onClick={() => onFilterChange({ ...filters, brandSlug: undefined })}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                !filters.brandSlug
                  ? 'bg-orange-50 font-bold text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>Toutes les marques</span>
            </button>
            {brands.map((b) => (
              <button
                key={b.id}
                onClick={() => onFilterChange({ ...filters, brandSlug: b.slug })}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  filters.brandSlug === b.slug
                    ? 'bg-orange-50 font-bold text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{b.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Product Type Filter */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => toggleSection('types')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 hover:text-orange-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            Type de composant
          </span>
          {expandedSections.types ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expandedSections.types && (
          <div className="space-y-1">
            {PRODUCT_TYPES.map((pt) => (
              <button
                key={pt.value}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    productType: filters.productType === pt.value ? undefined : pt.value,
                  })
                }
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  filters.productType === pt.value
                    ? 'bg-orange-50 font-bold text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{pt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 5. Price Range DZD */}
      <div className="space-y-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between text-xs font-bold text-gray-900 hover:text-orange-600 transition-colors"
        >
          <span>Prix (DZD)</span>
          {expandedSections.price ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {expandedSections.price && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 font-medium">Min</label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium">Max</label>
                <input
                  type="number"
                  placeholder="50000"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              onClick={handlePriceApply}
              className="w-full py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-orange-500 transition-colors"
            >
              Appliquer le prix
            </button>
          </div>
        )}
      </div>

    </aside>
  );
}
