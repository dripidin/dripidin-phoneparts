'use client';

// HamzaPhone Customer Order History Cards & Filters

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  CreditCard,
  MapPin,
  Sparkles
} from 'lucide-react';
import type { CustomerOrderSummary } from '@/lib/services/customer-account.service';

interface OrderHistoryListProps {
  orders: CustomerOrderSummary[];
}

const STATUS_BADGES: Record<string, { label: string; icon: any; className: string }> = {
  PENDING: { label: 'En attente de confirmation', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  CONFIRMED: { label: 'Confirmée & En préparation', icon: CheckCircle2, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  PROCESSING: { label: 'En cours d\'emballage', icon: Package, className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  READY_FOR_SHIPMENT: { label: 'Prête pour expédition', icon: Truck, className: 'bg-purple-50 text-purple-700 border-purple-200' },
  SHIPPED: { label: 'En cours de livraison (EcoTrack)', icon: Truck, className: 'bg-orange-50 text-orange-700 border-orange-200' },
  DELIVERED: { label: 'Colis Livré & Réceptionné', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELLED: { label: 'Commande Annulée', icon: XCircle, className: 'bg-gray-100 text-gray-700 border-gray-200' },
  FAILED: { label: 'Échec de livraison', icon: AlertCircle, className: 'bg-red-50 text-red-700 border-red-200' },
};

export function OrderHistoryList({ orders }: OrderHistoryListProps) {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED'].includes(o.status);
    if (filter === 'DELIVERED') return o.status === 'DELIVERED';
    if (filter === 'CANCELLED') return ['CANCELLED', 'FAILED', 'RETURNED'].includes(o.status);
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Historique de vos Commandes
          </h2>
          <p className="text-xs text-gray-500">
            Suivez l&apos;état d&apos;acheminement de vos colis en direct dans les 58 Wilayas.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'Toutes' },
            { id: 'ACTIVE', label: 'En cours' },
            { id: 'DELIVERED', label: 'Livrées' },
            { id: 'CANCELLED', label: 'Annulées' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                filter === tab.id
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-900">Aucune commande trouvée</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Vous n&apos;avez aucune commande dans cette catégorie pour le moment.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md"
          >
            <span>Commander des pièces</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const badge = STATUS_BADGES[order.status] || {
              label: order.status,
              icon: Package,
              className: 'bg-gray-100 text-gray-700 border-gray-200',
            };
            const BadgeIcon = badge.icon;
            const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all space-y-4"
              >
                
                {/* Order Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs sm:text-sm font-extrabold text-gray-900">
                      N° {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      du {formattedDate}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.className}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{badge.label}</span>
                  </span>
                </div>

                {/* Order Summary Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Articles</span>
                    <strong className="text-gray-800 font-bold">
                      {order.itemsCount} pièce{order.itemsCount > 1 ? 's' : ''}
                    </strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Montant Total</span>
                    <strong className="text-orange-600 font-extrabold text-sm">
                      {order.totalAmountDzd.toLocaleString('fr-DZ')} DZD
                    </strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Paiement</span>
                    <strong className="text-gray-800 font-semibold flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'À la livraison (COD)' : order.paymentMethod}
                    </strong>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[11px]">Suivi Colis</span>
                    {order.trackingNumber ? (
                      <span className="font-mono text-orange-600 font-bold text-xs">
                        {order.trackingNumber}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-mono text-[11px]">En attente</span>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Livraison Wilaya {order.wilayaCode.toString().padStart(2, '0')}
                  </span>

                  <Link
                    href={`/account/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    <span>Voir les détails et le suivi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
