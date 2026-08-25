'use client';

// HamzaPhone Reusable Responsive Product Card (Mobile-First 2-Col & Desktop 4-Col Grid)

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check, CheckCircle2, AlertTriangle, AlertCircle, Smartphone, Sparkles } from 'lucide-react';
import type { PublicProductSummary } from '@/lib/services/storefront.service';
import { useCart } from '@/components/providers/cart-provider';

interface ProductCardProps {
  product: PublicProductSummary;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart } = useCart();
  const [addedAnimation, setAddedAnimation] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.availableStock <= 0) return;

    addToCart(product, 1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1500);
  };

  const discountPercent = product.isOnSale && product.b2cSalePriceDzd
    ? Math.round(((product.b2cPriceDzd - product.b2cSalePriceDzd) / product.b2cPriceDzd) * 100)
    : 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200/80 hover:border-orange-500/40 hover:shadow-lg transition-all duration-200 flex flex-col overflow-hidden">
      
      {/* 1. Top Badges & Image Area */}
      <div className="relative aspect-square w-full bg-gray-50/80 p-3 overflow-hidden">
        
        {/* Floating Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-extrabold shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
              TOP
            </span>
          )}
          {product.isOnSale && discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[10px] font-extrabold shadow-xs">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Stock Badge on Top Right */}
        <div className="absolute top-2.5 right-2.5 z-10">
          {product.availableStock > 5 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
              En stock
            </span>
          ) : product.availableStock > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
              Reste {product.availableStock}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold">
              <AlertCircle className="w-2.5 h-2.5 text-red-600" />
              Rupture
            </span>
          )}
        </div>

        {/* Product Image */}
        <Link href={`/products/${product.slug}`} className="block relative w-full h-full">
          <Image
            src={product.mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-contain object-center group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
      </div>

      {/* 2. Product Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        
        <div className="space-y-1.5">
          {/* Brand & SKU Header */}
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            {product.brandName ? (
              <span className="font-bold text-gray-700 uppercase tracking-wide">
                {product.brandName}
              </span>
            ) : (
              <span className="font-medium text-gray-400">HamzaPhone</span>
            )}
            <span className="font-mono text-[10px] text-gray-400">
              {product.sku}
            </span>
          </div>

          {/* Product Title */}
          <Link href={`/products/${product.slug}`} className="block">
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Compatibility Pill if available */}
          {product.compatibilityList && product.compatibilityList.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 truncate">
              <Smartphone className="w-3 h-3 text-orange-500 shrink-0" />
              <span className="truncate">
                {product.compatibilityList.slice(0, 2).join(', ')}
                {product.compatibilityList.length > 2 ? ` +${product.compatibilityList.length - 2}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* 3. Price & Add CTA */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-base font-extrabold text-orange-600">
                {product.effectivePriceDzd.toLocaleString('fr-DZ')} DZD
              </span>
            </div>
            {product.isOnSale && product.b2cSalePriceDzd && (
              <span className="text-[11px] text-gray-400 line-through">
                {product.b2cPriceDzd.toLocaleString('fr-DZ')} DZD
              </span>
            )}
          </div>

          {/* Quick Add to Cart CTA */}
          <button
            onClick={handleQuickAdd}
            disabled={product.availableStock <= 0}
            className={`p-2.5 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              product.availableStock <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : addedAnimation
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 active:scale-95'
            }`}
            aria-label={`Ajouter ${product.name} au panier`}
          >
            {addedAnimation ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="hidden sm:inline">Ajouté</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Ajouter</span>
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
