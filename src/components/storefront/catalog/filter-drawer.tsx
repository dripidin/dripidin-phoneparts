'use client';

// HamzaPhone Mobile Filter Drawer Bottom-Sheet

import React, { useState } from 'react';
import { X, SlidersHorizontal, CheckCircle2, RotateCcw } from 'lucide-react';
import type { FilterState } from './filter-sidebar';
import type { ProductType } from '@/types/database.types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  categories: Array<{ id: string; name: string; slug: string }>;
  brands: Array<{ id: string; name: string; slug: string }>;
  onClearAll: () => void;
}

const PRODUCT_TYPES: Array<{ value: ProductType; label: string }> = [
  { value: 'OEM_ORIGINAL', label: 'OEM Original' },
  { value: 'SERVICE_PACK', label: 'Service Pack' },
  { value: 'REFURBISHED', label: 'Reconditionné' },
  { value: 'HIGH_COPY', label: 'High Copy' },
  { value: 'AFTERMARKET', label: 'Aftermarket' },
  { value: 'ACCESSORY', label: 'Accessoires' },
  { value: 'TOOL', label: 'Outils' },
];

export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  categories,
  brands,
  onClearAll,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden lg:hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <SlidersHorizontal className="w-4 h-4 text-orange-500" />
              <span>Filtrer les pièces</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            
            {/* In Stock */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <label htmlFor="mobile-in-stock" className="text-xs font-bold text-gray-900 flex items-center gap-1.5 cursor-pointer">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>En stock uniquement</span>
              </label>
              <input
                id="mobile-in-stock"
                type="checkbox"
                checked={Boolean(filters.inStockOnly)}
                onChange={(e) =>
                  onFilterChange({ ...filters, inStockOnly: e.target.checked ? true : undefined })
                }
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300"
              />
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Catégories
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onFilterChange({ ...filters, categorySlug: undefined })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !filters.categorySlug
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onFilterChange({ ...filters, categorySlug: cat.slug })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filters.categorySlug === cat.slug
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brands */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Marques
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onFilterChange({ ...filters, brandSlug: undefined })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !filters.brandSlug
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Toutes
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onFilterChange({ ...filters, brandSlug: b.slug })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filters.brandSlug === b.slug
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Type */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Type de Pièce
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_TYPES.map((pt) => (
                  <button
                    key={pt.value}
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        productType: filters.productType === pt.value ? undefined : pt.value,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filters.productType === pt.value
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            <button
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-md"
            >
              Afficher les résultats
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
