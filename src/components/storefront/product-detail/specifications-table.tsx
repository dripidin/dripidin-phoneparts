'use client';

// HamzaPhone Product Technical Specifications Table & Description

import React from 'react';
import { Layers, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { PublicProductDetail } from '@/lib/services/storefront.service';

interface SpecificationsTableProps {
  product: PublicProductDetail;
}

export function SpecificationsTable({ product }: SpecificationsTableProps) {
  const safeString = (val: any, fallback = 'Standard'): string => {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      const { length, width, height } = val;
      if (length !== undefined || width !== undefined || height !== undefined) {
        return `${length || '—'} × ${width || '—'} × ${height || '—'} cm`;
      }
      return JSON.stringify(val);
    }
    return String(val);
  };

  const specs = [
    { label: 'Type de Pièce', value: safeString(product.productType, 'Pièce détachée') },
    { label: 'Marque Fabricant', value: safeString(product.brand?.name, 'Universel') },
    { label: 'Catégorie', value: safeString(product.category?.name, 'Pièce détachée') },
    { label: 'Référence Fabricant (SKU)', value: safeString(product.sku, '—') },
    { label: 'Code-Barres EAN', value: safeString(product.barcode, '—') },
    { label: 'Poids Estimé', value: product.weightGrams ? `${product.weightGrams} g` : 'Standard' },
    { label: 'Dimensions', value: safeString(product.dimensionsCm, 'Standard') },
    { label: 'État du Composant', value: '100% Neuf & Testé' },
    { label: 'Garantie SAV Algérie', value: 'Garantie fonctionnelle avant collage' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 space-y-6 shadow-xs">
      
      {/* Description Section */}
      {(product.description || product.shortDescription) && (
        <div className="space-y-3 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <FileText className="w-4 h-4 text-orange-500" />
            <span>Description détaillée du produit</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description || product.shortDescription}
          </div>
        </div>
      )}

      {/* Specifications Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <Layers className="w-4 h-4 text-orange-500" />
          <span>Fiche technique & Caractéristiques</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
            >
              <span className="text-gray-500 font-medium">{spec.label}</span>
              <span className="font-bold text-gray-900 text-right">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workshop Tips */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Conseil aux réparateurs et techniciens :</span>
        </div>
        <p className="text-amber-800 leading-normal">
          Testez toujours l&apos;écran ou la pièce à sec (connectez les nappes sans retirer les films de protection ni appliquer la colle B7000/T7000) pour valider l&apos;affichage et le tactile.
        </p>
      </div>

    </div>
  );
}
