'use client';

// HamzaPhone Instant Search Overlay & Suggestion Panel with Multi-Category Grouping

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FolderTree, 
  Tag, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Search,
} from 'lucide-react';
import type { InstantSearchSuggestions } from '@/lib/services/storefront.service';

export interface InstantSearchOverlayProps {
  suggestions?: InstantSearchSuggestions;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  query: string;
  selectedIndex: number;
}

export function InstantSearchOverlay({
  suggestions,
  isLoading,
  isOpen,
  onClose,
  query,
  selectedIndex,
}: InstantSearchOverlayProps) {
  if (!isOpen || query.trim().length < 2) return null;

  const hasProducts = Boolean(suggestions?.products && suggestions.products.length > 0);
  const hasCategories = Boolean(suggestions?.categories && suggestions.categories.length > 0);
  const hasBrands = Boolean(suggestions?.brands && suggestions.brands.length > 0);
  const hasModels = Boolean(suggestions?.deviceModels && suggestions.deviceModels.length > 0);
  const hasAnyResults = hasProducts || hasCategories || hasBrands || hasModels;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Overlay Dropdown */}
      <div 
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
        role="listbox"
        id="search-suggestions-panel"
      >
        {isLoading && !hasAnyResults ? (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-sm font-medium">Recherche instantanée des pièces...</p>
          </div>
        ) : !hasAnyResults && !isLoading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Aucune pièce trouvée pour « {query} »</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
              Vérifiez la référence (ex: Samsung S22, A2633, Écran OLED) ou parcourez notre catalogue complet.
            </p>
            <Link
              href={`/products?search=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
            >
              Rechercher dans tout le catalogue
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[60vh] sm:max-h-[75vh] overflow-y-auto">
            {/* Quick Filter Direct Hits (Categories / Brands / Models) */}
            {(hasCategories || hasBrands || hasModels) && (
              <div className="p-3 bg-gray-50/80">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-2">
                  Suggestions directes
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* Categories */}
                  {suggestions?.categories.map((cat) => (
                    <Link
                      key={`cat-${cat.id}`}
                      href={`/categories/${cat.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-all shadow-2xs"
                    >
                      <FolderTree className="w-3.5 h-3.5 text-orange-500" />
                      <span>{cat.name}</span>
                    </Link>
                  ))}

                  {/* Brands */}
                  {suggestions?.brands.map((brand) => (
                    <Link
                      key={`brand-${brand.id}`}
                      href={`/brands/${brand.slug}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:border-orange-500 hover:text-orange-600 transition-all shadow-2xs"
                    >
                      <Tag className="w-3.5 h-3.5 text-blue-500" />
                      <span>{brand.name}</span>
                    </Link>
                  ))}

                  {/* Device Models */}
                  {suggestions?.deviceModels.map((model) => (
                    <Link
                      key={`model-${model.id}`}
                      href={`/products?search=${encodeURIComponent(model.name)}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-700 hover:bg-orange-100 transition-all shadow-2xs"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                      <span>{model.name}</span>
                      {model.modelCode && (
                        <span className="text-[10px] text-orange-500 font-mono">({model.modelCode})</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Matching Products */}
            {hasProducts && (
              <div className="p-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1">
                  Pièces Détachées ({suggestions?.products.length})
                </div>
                <div className="space-y-1">
                  {suggestions?.products.map((prod, idx) => (
                    <Link
                      key={prod.id}
                      href={`/products/${prod.slug}`}
                      onClick={onClose}
                      className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all ${
                        idx === selectedIndex
                          ? 'bg-orange-50/80 border border-orange-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="relative w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                        <Image
                          src={prod.mainImage}
                          alt={prod.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {prod.brandName && (
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                              {prod.brandName}
                            </span>
                          )}
                          <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                            {prod.sku}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-gray-900 truncate">
                          {prod.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold text-orange-600">
                            {prod.salePriceDzd 
                              ? `${prod.salePriceDzd.toLocaleString('fr-DZ')} DZD`
                              : `${prod.priceDzd.toLocaleString('fr-DZ')} DZD`}
                          </span>
                          {prod.salePriceDzd && (
                            <span className="text-[11px] text-gray-400 line-through">
                              {prod.priceDzd.toLocaleString('fr-DZ')} DZD
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {prod.availableStock > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            En stock ({prod.availableStock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Rupture
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Footer View All */}
            <div className="p-3 bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Appuyez sur <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border rounded shadow-2xs">Entrée</kbd> pour tout afficher
              </span>
              <Link
                href={`/products?search=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
              >
                Voir tous les résultats
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
