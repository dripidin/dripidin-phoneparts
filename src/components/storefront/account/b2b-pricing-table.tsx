'use client';

// HamzaPhone B2B Wholesale Pricing Matrix & Fast Ordering View

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Sparkles, 
  Search, 
  ShoppingBag, 
  Check, 
  CheckCircle2, 
  TrendingDown,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useB2BWholesalePricing } from '@/lib/hooks/use-customer-account';
import { useCart } from '@/components/providers/cart-provider';

export function B2BPricingTable() {
  const { data: pricingList = [], isLoading, error } = useB2BWholesalePricing();
  const { addToCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [addedItem, setAddedItem] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-8 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
        <p className="text-xs text-gray-500 font-medium">
          Chargement de votre grille tarifaire grossiste personnalisée...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-3xl text-center space-y-3 text-red-800 text-xs">
        <ShieldCheck className="w-8 h-8 text-red-600 mx-auto" />
        <h3 className="font-bold text-sm">Accès Réservé aux Comptes B2B Approuvés</h3>
        <p className="max-w-md mx-auto">
          {error.message || 'Votre compte n\'a pas encore été validé pour accéder à cette grille tarifaire.'}
        </p>
        <Link
          href="/account/business"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
        >
          <span>Vérifier mon dossier B2B</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const filteredPricing = pricingList.filter((item: any) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brandName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFastAdd = (item: any) => {
    addToCart(
      {
        id: item.productId,
        name: item.productName,
        sku: item.sku,
        barcode: null,
        slug: item.slug,
        mainImage: item.mainImage,
        effectivePriceDzd: item.b2bPriceDzd,
        b2cPriceDzd: item.b2cPriceDzd,
        b2cSalePriceDzd: null,
        isOnSale: false,
        stockQuantity: item.availableStock,
        availableStock: item.availableStock,
        isAvailable: item.availableStock > 0,
        isFeatured: false,
        productType: 'OEM_ORIGINAL',
        brandName: item.brandName,
        categoryName: item.categoryName,
        createdAt: '',
      },
      item.minQuantity || 1
    );

    setAddedItem(item.id);
    setTimeout(() => setAddedItem(null), 1500);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
              <Sparkles className="w-4 h-4" />
              <span>Grille Tarifaire B2B Active</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
              Tarifs Grossiste Réservés aux Ateliers
            </h2>
            <p className="text-xs text-gray-500">
              Prix nets hors taxes et remises dégressives appliquées à votre compte.
            </p>
          </div>

          {/* Search within pricing */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrer une référence ou pièce..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-4 sm:p-6 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-100">
                <th className="py-3 px-4 rounded-l-xl">Pièce Détachée</th>
                <th className="py-3 px-4">Marque</th>
                <th className="py-3 px-4">Prix Public</th>
                <th className="py-3 px-4">Votre Prix B2B</th>
                <th className="py-3 px-4">Économie</th>
                <th className="py-3 px-4">Stock Réel</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Action Rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPricing.map((item: any) => (
                <tr key={item.id} className="hover:bg-purple-50/30 transition-colors">
                  
                  {/* Product */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 p-0.5 shrink-0 overflow-hidden">
                        <Image
                          src={item.mainImage}
                          alt={item.productName}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1"
                        >
                          {item.productName}
                        </Link>
                        <span className="font-mono text-[10px] text-gray-400 block">
                          SKU: {item.sku}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Brand */}
                  <td className="py-3.5 px-4 font-semibold text-gray-700">
                    {item.brandName}
                  </td>

                  {/* B2C Price */}
                  <td className="py-3.5 px-4 text-gray-400 line-through">
                    {item.b2cPriceDzd.toLocaleString('fr-DZ')} DZD
                  </td>

                  {/* B2B Price */}
                  <td className="py-3.5 px-4">
                    <strong className="text-purple-700 font-extrabold text-sm">
                      {item.b2bPriceDzd.toLocaleString('fr-DZ')} DZD
                    </strong>
                  </td>

                  {/* Savings */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                      <TrendingDown className="w-3 h-3" />
                      -{item.savingsPercent}% ({item.savingsDzd.toLocaleString('fr-DZ')} DZD)
                    </span>
                  </td>

                  {/* Stock */}
                  <td className="py-3.5 px-4">
                    {item.availableStock > 0 ? (
                      <span className="text-emerald-700 font-bold text-[11px]">
                        {item.availableStock} en stock
                      </span>
                    ) : (
                      <span className="text-red-600 font-bold text-[11px]">
                        Rupture
                      </span>
                    )}
                  </td>

                  {/* Add CTA */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleFastAdd(item)}
                      disabled={item.availableStock <= 0}
                      className={`p-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${
                        addedItem === item.id
                          ? 'bg-emerald-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs disabled:opacity-40'
                      }`}
                    >
                      {addedItem === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Ajouté</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Ajouter</span>
                        </>
                      )}
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
