'use client';

// HamzaPhone Order Confirmation View
// Displays Success State, Order Number, Delivery Snapshot, and Next Steps for COD

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  Copy,
  Check,
  Truck,
  Banknote,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Loader2,
} from 'lucide-react';
import { lookupGuestOrderAction } from '@/lib/actions/checkout.actions';

interface OrderConfirmationViewProps {
  orderNumber: string;
  trackingToken: string;
}

export function OrderConfirmationView({
  orderNumber,
  trackingToken,
}: OrderConfirmationViewProps) {
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber || !trackingToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await lookupGuestOrderAction(orderNumber, trackingToken);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrder();
  }, [orderNumber, trackingToken]);

  const copyOrderNumber = () => {
    if (!orderNumber) return;
    navigator.clipboard.writeText(orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-xs text-gray-500">Chargement de votre confirmation de commande...</p>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-12 max-w-3xl mx-auto space-y-8 px-4">
      
      {/* Celebration Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 text-center shadow-xl space-y-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Commande enregistrée</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Merci pour votre commande !
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
            Votre commande a été transmise à notre équipe logistique. Un conseiller vous contactera par téléphone pour confirmer l'expédition.
          </p>
        </div>

        {/* Order Number Box */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 inline-flex items-center justify-between gap-4 max-w-md w-full mx-auto">
          <div className="text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Numéro de Commande
            </span>
            <div className="font-mono text-base sm:text-lg font-black text-gray-900">
              {orderNumber}
            </div>
          </div>

          <button
            type="button"
            onClick={copyOrderNumber}
            className="p-2.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copié</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-500" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* COD Payment Notice Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-5 sm:p-7 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base">
          <Banknote className="w-5 h-5" />
          <span>Paiement en Espèces à la Livraison (COD)</span>
        </div>
        <p className="text-xs sm:text-sm text-orange-50 leading-relaxed">
          Veuillez préparer le montant exact de{' '}
          <strong className="text-white underline font-black">
            {order ? order.total_dzd.toLocaleString('fr-DZ') : '---'} DZD
          </strong>{' '}
          en espèces pour le livreur lors de la réception de votre colis.
        </p>
      </div>

      {/* Order Details & Summary Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3">
            Détails de la Livraison
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
            
            {/* Delivery Info */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500" />
                <span>Destinataire</span>
              </span>
              <p className="font-extrabold text-gray-900">{order.recipient_name}</p>
              <p className="text-gray-600 font-mono">{order.recipient_phone}</p>
              <p className="text-gray-600">{order.shipping_address_line}</p>
              <p className="text-gray-500 font-medium">
                {order.commune_name}, {order.wilaya_name}
              </p>
            </div>

            {/* Status & Delivery Method */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-orange-500" />
                <span>Mode d'expédition</span>
              </span>
              <p className="font-extrabold text-gray-900">
                {order.delivery_type === 'HOME' ? 'Livraison à Domicile / Atelier' : 'Retrait en Agence Stopdesk'}
              </p>
              <p className="text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                <span>Statut : En attente de confirmation</span>
              </p>
            </div>

          </div>

          {/* Line Items List */}
          {order.order_items && order.order_items.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Articles Commandés ({order.order_items.length})
              </h3>
              <div className="divide-y divide-gray-100">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-gray-900 truncate">{item.product_name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">SKU: {item.sku} • Qté: {item.quantity}</p>
                    </div>
                    <div className="font-extrabold text-gray-900">
                      {item.total_price_dzd.toLocaleString('fr-DZ')} DZD
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Totals */}
          <div className="space-y-2 pt-4 border-t border-gray-100 text-xs sm:text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total articles</span>
              <span className="font-bold text-gray-900">{order.subtotal_dzd.toLocaleString('fr-DZ')} DZD</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Frais de livraison</span>
              <span className="font-bold text-gray-900">{order.shipping_cost_dzd.toLocaleString('fr-DZ')} DZD</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
              <span>Montant total</span>
              <span className="text-orange-600">{order.total_dzd.toLocaleString('fr-DZ')} DZD</span>
            </div>
          </div>

        </div>
      )}

      {/* Action Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
        <Link
          href={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(trackingToken)}`}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gray-900 text-white font-extrabold text-xs sm:text-sm hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <Truck className="w-4 h-4" />
          <span>Suivre ma commande en direct</span>
        </Link>

        <Link
          href="/products"
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-800 font-extrabold text-xs sm:text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <span>Continuer mes achats</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
