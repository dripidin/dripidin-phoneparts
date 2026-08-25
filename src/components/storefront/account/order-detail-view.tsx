'use client';

// HamzaPhone Customer Order Detailed Breakdown & Stepper View

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  CreditCard, 
  ExternalLink,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface OrderDetailViewProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    subtotalDzd: number;
    shippingCostDzd: number;
    discountAmountDzd: number;
    totalAmountDzd: number;
    wilayaCode: number;
    wilayaName?: string;
    shippingAddress?: any;
    trackingNumber: string | null;
    notes: string | null;
    createdAt: string;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      sku: string;
      unitPriceDzd: number;
      quantity: number;
      totalPriceDzd: number;
      mainImage: string;
      slug: string;
    }>;
  };
}

export function OrderDetailView({ order }: OrderDetailViewProps) {
  const formattedDate = new Date(order.createdAt).toLocaleDateString('fr-DZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Step stages
  const steps = [
    { key: 'PENDING', label: 'Commande Reçue' },
    { key: 'CONFIRMED', label: 'Confirmée' },
    { key: 'SHIPPED', label: 'Expédiée EcoTrack' },
    { key: 'DELIVERED', label: 'Livrée' },
  ];

  const getStepStatus = (stepKey: string) => {
    const orderStatus = order.status;
    if (orderStatus === 'CANCELLED' || orderStatus === 'FAILED') return 'cancelled';
    
    const hierarchy = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY_FOR_SHIPMENT', 'SHIPPED', 'DELIVERED'];
    const currentIdx = hierarchy.indexOf(orderStatus);
    const stepIdx = hierarchy.indexOf(stepKey);

    if (currentIdx >= stepIdx) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l&apos;historique des commandes</span>
        </Link>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-mono">
              Commande #{order.orderNumber}
            </h1>
            <p className="text-xs text-gray-500">
              Passée le {formattedDate}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-400 block">Total de la commande</span>
            <span className="text-xl sm:text-2xl font-extrabold text-orange-600">
              {order.totalAmountDzd.toLocaleString('fr-DZ')} DZD
            </span>
          </div>
        </div>

        {/* Visual Timeline Stepper */}
        <div className="py-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
            Progression de la Livraison
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {steps.map((s, idx) => {
              const status = getStepStatus(s.key);
              return (
                <div
                  key={s.key}
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    status === 'completed'
                      ? 'bg-orange-50 border-orange-200 text-orange-950 font-bold'
                      : 'bg-gray-50 border-gray-100 text-gray-400 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono">Étape 0{idx + 1}</span>
                    {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-orange-600" />}
                  </div>
                  <div className="text-xs font-bold leading-tight">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tracking Banner if Shipped */}
        {order.trackingNumber && (
          <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-orange-950 font-bold block">
                  Colis Expédié via EcoTrack / Yalidine
                </strong>
                <span className="font-mono text-orange-800 text-[11px]">
                  N° de Suivi : <strong>{order.trackingNumber}</strong>
                </span>
              </div>
            </div>

            <a
              href={`https://ecotrack.dz/tracking/${order.trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors shadow-sm"
            >
              <span>Suivre sur EcoTrack</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

      </div>

      {/* Items Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900">
          Pièces & Composants Commandés ({order.items.length})
        </h3>

        <div className="divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 p-1 shrink-0 overflow-hidden">
                <Image
                  src={item.mainImage}
                  alt={item.productName}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                {item.slug ? (
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-bold text-xs sm:text-sm text-gray-900 hover:text-orange-600 transition-colors line-clamp-1"
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 line-clamp-1">
                    {item.productName}
                  </h4>
                )}
                <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono mt-0.5">
                  <span>SKU: {item.sku}</span>
                  <span>•</span>
                  <span>Qté: {item.quantity}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-extrabold text-xs sm:text-sm text-gray-900 block">
                  {item.totalPriceDzd.toLocaleString('fr-DZ')} DZD
                </span>
                <span className="text-[10px] text-gray-400">
                  {item.unitPriceDzd.toLocaleString('fr-DZ')} DZD / unité
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address & Price Totals Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Address Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span>Adresse de Livraison</span>
          </div>

          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-bold text-gray-900">
              {order.shippingAddress?.recipient_name || 'Client HamzaPhone'}
            </p>
            <p>{order.shippingAddress?.recipient_phone || '—'}</p>
            <p className="leading-relaxed font-medium pt-1">
              {order.shippingAddress?.address_line || 'Adresse standard'}
            </p>
            <p className="font-bold text-gray-800">
              {order.shippingAddress?.commune_name || ''}, Wilaya {order.wilayaCode.toString().padStart(2, '0')} - {order.wilayaName || ''}
            </p>
          </div>
        </div>

        {/* Price Breakdown Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <span>Récapitulatif Financier</span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-gray-100">
            <div className="flex justify-between text-gray-600 pt-1">
              <span>Sous-total articles :</span>
              <span className="font-bold text-gray-900">{order.subtotalDzd.toLocaleString('fr-DZ')} DZD</span>
            </div>

            <div className="flex justify-between text-gray-600 pt-2">
              <span>Frais de livraison (58 Wilayas) :</span>
              <span className="font-bold text-gray-900">{order.shippingCostDzd.toLocaleString('fr-DZ')} DZD</span>
            </div>

            {order.discountAmountDzd > 0 && (
              <div className="flex justify-between text-emerald-600 pt-2 font-bold">
                <span>Remise appliquée :</span>
                <span>-{order.discountAmountDzd.toLocaleString('fr-DZ')} DZD</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-3 text-sm">
              <span className="font-extrabold text-gray-900">Total TTC (DZD) :</span>
              <span className="text-lg font-extrabold text-orange-600">
                {order.totalAmountDzd.toLocaleString('fr-DZ')} DZD
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
