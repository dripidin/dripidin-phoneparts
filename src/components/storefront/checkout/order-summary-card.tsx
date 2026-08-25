'use client';

// HamzaPhone Checkout - Order Summary Card
// Real-time calculation, Line items preview, and Primary Order Submit Trigger

import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Truck, ArrowRight, Loader2, Tag } from 'lucide-react';
import type { CartItem } from '@/components/providers/cart-provider';

interface OrderSummaryCardProps {
  items: CartItem[];
  subtotalDzd: number;
  shippingCostDzd: number;
  totalDzd: number;
  wilayaName: string;
  isSubmitting: boolean;
  onSubmitOrder: () => void;
  canSubmit: boolean;
  errorMessage?: string | null;
}

export function OrderSummaryCard({
  items,
  subtotalDzd,
  shippingCostDzd,
  totalDzd,
  wilayaName,
  isSubmitting,
  onSubmitOrder,
  canSubmit,
  errorMessage,
}: OrderSummaryCardProps) {
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xl space-y-5 sticky top-24">
      
      <div className="border-b border-gray-100 pb-3">
        <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
          Votre Commande ({totalQuantity})
        </h3>
      </div>

      {/* Mini Line Items List */}
      <div className="max-h-60 overflow-y-auto divide-y divide-gray-50 pr-1 space-y-2">
        {items.map((item) => (
          <div key={item.productId} className="py-2 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
              <Image
                src={item.mainImage || '/images/placeholder.png'}
                alt={item.name}
                fill
                sizes="48px"
                className="object-contain p-1"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-gray-900 truncate">
                {item.name}
              </h5>
              <div className="flex items-center justify-between text-[11px] text-gray-500 mt-0.5">
                <span>Qté: {item.quantity}</span>
                <span className="font-bold text-gray-900">
                  {(item.priceDzd * item.quantity).toLocaleString('fr-DZ')} DZD
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2.5 text-xs sm:text-sm border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between text-gray-600">
          <span>Sous-total articles</span>
          <span className="font-bold text-gray-900">
            {subtotalDzd.toLocaleString('fr-DZ')} DZD
          </span>
        </div>

        <div className="flex items-center justify-between text-gray-600">
          <span className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-orange-500" />
            <span>Livraison ({wilayaName || 'Algérie'})</span>
          </span>
          <span className="font-bold text-gray-900">
            {shippingCostDzd.toLocaleString('fr-DZ')} DZD
          </span>
        </div>

        {/* Final Total */}
        <div className="pt-3 border-t border-gray-100 flex items-baseline justify-between">
          <div>
            <span className="text-sm sm:text-base font-extrabold text-gray-900">
              Total à payer
            </span>
            <p className="text-[10px] text-gray-400">Paiement en espèces au livreur</p>
          </div>
          <div className="text-right">
            <span className="text-lg sm:text-2xl font-black text-orange-600">
              {totalDzd.toLocaleString('fr-DZ')}
            </span>
            <span className="text-xs font-bold text-gray-500 ml-1">DZD</span>
          </div>
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Primary Submit Order Button */}
      <button
        type="button"
        disabled={isSubmitting || !canSubmit}
        onClick={onSubmitOrder}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-extrabold text-sm sm:text-base hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Traitement de la commande...</span>
          </>
        ) : (
          <>
            <span>Confirmer la commande (COD)</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Trust Guarantee */}
      <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Garantie conformité & pièces vérifiées</span>
        </div>
      </div>

    </div>
  );
}
