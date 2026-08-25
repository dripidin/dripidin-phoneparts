'use client';

// HamzaPhone Structured Smartphone Device Compatibility Matrix

import React from 'react';
import { Smartphone, CheckCircle, Info } from 'lucide-react';
import type { PublicProductDetail } from '@/lib/services/storefront.service';

interface CompatibilityTableProps {
  product: PublicProductDetail;
}

export function CompatibilityTable({ product }: CompatibilityTableProps) {
  const compatibilityItems = product.compatibility || [];
  const genericCompatibility = product.compatibilityList || [];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 space-y-5 shadow-xs">
      
      {/* Section Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Compatibilité Smartphone & Modèles Pris en Charge
          </h2>
          <p className="text-xs text-gray-500">
            Vérifiez attentivement le code modèle au dos de votre smartphone avant commande.
          </p>
        </div>
      </div>

      {compatibilityItems.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                <th className="py-3 px-4 rounded-l-xl">Modèle Smartphone</th>
                <th className="py-3 px-4">Code Modèle</th>
                <th className="py-3 px-4">Codes Variantes / Références</th>
                <th className="py-3 px-4 rounded-r-xl">Remarques & Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {compatibilityItems.map((item) => (
                <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{item.deviceModel?.name || product.brand?.name || 'Smartphone compatible'}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-medium text-gray-600">
                    {item.deviceModel?.modelCode || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {item.variantCodes && item.variantCodes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.variantCodes.map((code) => (
                          <span
                            key={code}
                            className="font-mono bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[11px] font-semibold border border-gray-200"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 font-mono">Toutes versions</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                    {item.notes || 'Installation directe sans modification'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : genericCompatibility.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-600 font-medium">
            Cette pièce est compatible avec les appareils suivants :
          </p>
          <div className="flex flex-wrap gap-2">
            {genericCompatibility.map((dev, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-xs font-bold text-orange-800"
              >
                <Smartphone className="w-3.5 h-3.5 text-orange-600" />
                <span>{dev}</span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gray-50 text-gray-600 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p>
            Veuillez vous référer au titre du produit et à la référence fabricant ({product.sku}) pour vérifier la compatibilité avec votre appareil.
          </p>
        </div>
      )}

    </div>
  );
}
