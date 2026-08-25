'use client';

// HamzaPhone Full Cart Page View
// Mobile-first with Wilaya Delivery Estimator, Live Sync & Checkout CTA

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';
import { CartItemCard } from './cart-item-card';
import { CartWarnings } from './cart-warnings';
import { ALGERIA_WILAYAS } from '@/lib/utils';
import { DeliveryPricingService } from '@/lib/delivery/delivery-pricing.service';

export function CartPageView() {
  const {
    items,
    itemCount,
    subtotalDzd,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncWithServer,
    isSyncing,
    serverWarnings,
    clearWarnings,
  } = useCart();

  const [selectedWilaya, setSelectedWilaya] = useState<number>(16); // Alger default

  const shippingCostDzd = items.length > 0
    ? DeliveryPricingService.calculateDeliveryCost({ wilayaCode: selectedWilaya, subtotalDzd }).finalCostDzd
    : 0;
  const totalDzd = subtotalDzd + shippingCostDzd;

  if (items.length === 0) {
    return (
      <div className="py-12 sm:py-20 max-w-xl mx-auto text-center space-y-6 px-4">
        <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center mx-auto text-orange-500 shadow-inner">
          <ShoppingBag className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Votre panier est vide
          </h1>
          <p className="text-sm text-gray-500">
            Découvrez notre catalogue de pièces détachées pour smartphones, écrans originaux et batteries certifiées.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-500 text-white font-extrabold text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
          >
            <span>Explorer le catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-10 space-y-6 sm:space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-extrabold border border-orange-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Articles vérifiés</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Mon Panier ({itemCount})
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => syncWithServer()}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
            <span>{isSyncing ? 'Vérification...' : 'Actualiser les prix'}</span>
          </button>

          <button
            type="button"
            onClick={clearCart}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vider le panier</span>
          </button>
        </div>
      </div>

      {/* Live Server Warnings Banner */}
      <CartWarnings warnings={serverWarnings} onDismiss={clearWarnings} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Items List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="space-y-3">
            {items.map((item) => (
              <CartItemCard
                key={item.productId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <Link
              href="/products"
              className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
            >
              ← Continuer mes achats
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-xl space-y-5 sticky top-24">
            
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
              Récapitulatif de la commande
            </h2>

            {/* Wilaya Delivery Estimator */}
            <div className="space-y-2 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              <label className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-orange-500" />
                <span>Estimation livraison (58 Wilayas)</span>
              </label>
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {ALGERIA_WILAYAS.map((w: { code: number; name: string }) => (
                  <option key={w.code} value={w.code}>
                    {w.code.toString().padStart(2, '0')} - {w.name} ({w.code === 16 ? '400 DZD' : '600 DZD'})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Calculations */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Sous-total ({itemCount} articles)</span>
                <span className="font-bold text-gray-900">{subtotalDzd.toLocaleString('fr-DZ')} DZD</span>
              </div>

              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1">
                  <span>Frais de livraison</span>
                </span>
                <span className="font-bold text-gray-900">{shippingCostDzd.toLocaleString('fr-DZ')} DZD</span>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-baseline justify-between">
                <div>
                  <span className="text-sm sm:text-base font-extrabold text-gray-900">Total estimé</span>
                  <p className="text-[11px] text-gray-400">Paiement à la livraison (COD)</p>
                </div>
                <div className="text-right">
                  <span className="text-lg sm:text-2xl font-black text-orange-600">
                    {totalDzd.toLocaleString('fr-DZ')}
                  </span>
                  <span className="text-xs font-bold text-gray-500 ml-1">DZD</span>
                </div>
              </div>
            </div>

            {/* Checkout Primary Button */}
            <Link
              href="/checkout"
              className="w-full py-4 rounded-2xl bg-orange-500 text-white font-extrabold text-sm sm:text-base hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.99]"
            >
              <span>Passer la commande</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Trust Badges */}
            <div className="space-y-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                <span>Paiement 100% sécurisé à la réception (Cash on Delivery)</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-orange-500 shrink-0" />
                <span>Livraison express à domicile dans les 58 Wilayas</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
