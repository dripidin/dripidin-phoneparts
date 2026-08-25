'use client';

// HamzaPhone Slide-Over Cart Drawer
// Mobile-first with Server Validation Sync & Direct Links to /cart and /checkout

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '@/components/providers/cart-provider';

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotalDzd,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    syncWithServer,
    isSyncing,
    serverWarnings,
    clearWarnings,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Votre Panier</h3>
                <p className="text-xs text-gray-500">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => syncWithServer()}
                  disabled={isSyncing}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                  title="Actualiser les prix"
                >
                  <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-orange-500' : ''}`} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Fermer le panier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Warnings Banner if any */}
          {serverWarnings.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 flex items-start justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold">{serverWarnings[0]}</span>
              </div>
              <button
                type="button"
                onClick={clearWarnings}
                className="text-amber-500 hover:text-amber-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-gray-900 mb-1">Votre panier est vide</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mb-6">
                  Découvrez nos milliers de pièces détachées smartphone (Écrans, Batteries, Connecteurs) disponibles immédiatement en Algérie.
                </p>
                <Link
                  href="/products"
                  onClick={() => setIsCartOpen(false)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-all shadow-md"
                >
                  Explorer le Catalogue
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.productId} className="py-3.5 flex gap-3">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="relative w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 block"
                    >
                      <Image
                        src={item.mainImage || '/images/placeholder.png'}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-contain p-1"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsCartOpen(false)}
                          className="text-xs font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] font-mono text-gray-400 mb-2">
                        {item.sku}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/50">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 text-gray-500 hover:text-gray-900 transition-colors"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-extrabold text-orange-600">
                          {(item.priceDzd * item.quantity).toLocaleString('fr-DZ')} DZD
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer & Actions */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/80 space-y-3">
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="font-semibold text-gray-900">
                    {subtotalDzd.toLocaleString('fr-DZ')} DZD
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-orange-500" />
                    Livraison 58 Wilayas (COD)
                  </span>
                  <span>Calculée à la commande</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total estimé</span>
                  <span className="text-base text-orange-600 font-extrabold">
                    {subtotalDzd.toLocaleString('fr-DZ')} DZD
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Paiement en espèces à la livraison (COD)</span>
              </div>

              <div className="space-y-2 pt-1">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-orange-500 text-white font-extrabold text-sm hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 active:scale-[0.99]"
                >
                  <span>Commander (Paiement à la livraison)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <Link
                    href="/cart"
                    onClick={() => setIsCartOpen(false)}
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    Voir le panier complet →
                  </Link>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-gray-400 hover:text-red-500 transition-colors font-normal"
                  >
                    Vider le panier
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
