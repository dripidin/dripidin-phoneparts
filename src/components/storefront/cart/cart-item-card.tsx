'use client';

// HamzaPhone Cart Item Card
// Mobile-first with Quantity controls, Stock badge, and Wholesale pricing indicators

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { CartItem } from '@/components/providers/cart-provider';

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const isWholesale = item.pricingTierApplied === 'B2B_TIER' || item.pricingTierApplied === 'VOLUME_BREAK';
  const lineTotal = item.priceDzd * item.quantity;

  return (
    <div className="flex gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 transition-all shadow-xs">
      
      {/* Product Image Thumbnail */}
      <Link href={`/products/${item.slug}`} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 block">
        <Image
          src={item.mainImage || '/images/placeholder.png'}
          alt={item.name}
          fill
          className="object-contain p-1.5"
          sizes="96px"
        />
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/products/${item.slug}`}
              className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors"
            >
              {item.name}
            </Link>

            <button
              type="button"
              onClick={() => onRemove(item.productId)}
              aria-label={`Supprimer ${item.name}`}
              className="text-gray-400 hover:text-red-500 p-1 transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[11px] text-gray-500">
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
              {item.sku}
            </span>

            {isWholesale && (
              <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">
                <ShieldCheck className="w-3 h-3" />
                Tarif Grossiste
              </span>
            )}
          </div>

          {item.warning && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{item.warning}</span>
            </div>
          )}
        </div>

        {/* Price & Quantity Controls */}
        <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-gray-50">
          <div>
            <div className="text-xs sm:text-sm font-extrabold text-gray-900">
              {lineTotal.toLocaleString('fr-DZ')} <span className="text-[10px] font-normal text-gray-500">DZD</span>
            </div>
            {item.quantity > 1 && (
              <div className="text-[10px] text-gray-400">
                {item.priceDzd.toLocaleString('fr-DZ')} DZD / unité
              </div>
            )}
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs text-xs font-bold"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 sm:w-8 text-center text-xs font-extrabold text-gray-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
              disabled={item.quantity >= item.availableStock}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white text-gray-700 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs text-xs font-bold"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
