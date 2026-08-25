'use client';

// HamzaPhone Dual-Verification Guest & Public Order Tracking Portal

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useGuestOrderLookup } from '@/lib/hooks/use-checkout';
import type { OrderStatus } from '@/types/database.types';

export function GuestTrackingView() {
  const searchParams = useSearchParams();
  const initialOrderNumber = searchParams.get('orderNumber') || '';
  const initialToken = searchParams.get('token') || '';

  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber);
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [searchTriggered, setSearchTriggered] = useState(!!(initialOrderNumber && initialToken));

  const { data: order, isLoading, error, refetch } = useGuestOrderLookup(
    orderNumberInput,
    tokenInput,
    searchTriggered
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumberInput.trim() && tokenInput.trim()) {
      setSearchTriggered(true);
      refetch();
    }
  };

  const steps: Array<{ status: OrderStatus; label: string; desc: string }> = [
    { status: 'PENDING', label: 'Enregistrée', desc: 'En attente de confirmation' },
    { status: 'CONFIRMED', label: 'Confirmée', desc: 'Commande validée par l\'atelier' },
    { status: 'SHIPPED', label: 'En Livraison', desc: 'Prise en charge par le transporteur' },
    { status: 'DELIVERED', label: 'Livrée', desc: 'Colis remis en main propre' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'READY_FOR_SHIPMENT': return 1;
      case 'SHIPPED': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="py-6 sm:py-12 max-w-3xl mx-auto space-y-8 px-4">
      
      {/* Search Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-extrabold border border-orange-200">
          <Truck className="w-3.5 h-3.5" />
          <span>Suivi de Livraison en Direct</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Suivre ma Commande
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
          Renseignez votre numéro de commande et votre clé de sécurité figurant sur votre reçu.
        </p>
      </div>

      {/* Dual Token Search Form Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xl">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Numéro de Commande *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: HP-2026-123456"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">
                Clé de Sécurité (Tracking Token) *
              </label>
              <input
                type="text"
                required
                placeholder="Clé à 32 caractères"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-orange-500 text-white font-extrabold text-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recherche en cours...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Consulter le statut du colis</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{(error as any).message || 'Commande introuvable. Vérifiez vos identifiants.'}</span>
        </div>
      )}

      {/* Order Status Display */}
      {order && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Header & Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-5">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Commande
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-mono">
                {order.order_number}
              </h2>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Passée le {new Date(order.created_at).toLocaleDateString('fr-DZ')}</span>
              </p>
            </div>

            <div className="self-start sm:self-center">
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                order.status === 'DELIVERED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : order.status === 'SHIPPED'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : order.status === 'CANCELLED'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}>
                {order.status === 'PENDING' && 'Enregistrée (Attente confirmation)'}
                {order.status === 'CONFIRMED' && 'Confirmée'}
                {order.status === 'PROCESSING' && 'Préparation à l\'atelier'}
                {order.status === 'READY_FOR_SHIPMENT' && 'Prête pour expédition'}
                {order.status === 'SHIPPED' && 'En cours d\'acheminement'}
                {order.status === 'DELIVERED' && 'Colis Livré'}
                {order.status === 'CANCELLED' && 'Commande Annulée'}
              </span>
            </div>
          </div>

          {/* Active Courier Tracking Number Card */}
          {order.tracking_number && (
            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900">EcoTrack Express</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-orange-200 font-bold text-orange-800">
                      {order.tracking_number}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500">Expédition suivie dans les 58 Wilayas</span>
                </div>
              </div>

              <a
                href={`https://ecotrack.dz/track/${order.tracking_number}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100 text-orange-700 font-bold border border-orange-200 transition-colors shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ouvrir sur EcoTrack</span>
              </a>
            </div>
          )}

          {/* Stepper Timeline */}
          {!isCancelled && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Progression de la livraison
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
                {steps.map((s, idx) => {
                  const isPassed = idx <= currentStep;
                  const isCurrent = idx === currentStep;

                  return (
                    <div
                      key={s.status}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-orange-500 bg-orange-50/60 shadow-xs ring-1 ring-orange-500/30'
                          : isPassed
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-gray-100 bg-gray-50/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isPassed ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span className="text-xs font-extrabold text-gray-900">{s.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recipient & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100 text-xs sm:text-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-500" />
                <span>Adresse de réception</span>
              </span>
              <p className="font-bold text-gray-900">{order.recipient_name} ({order.recipient_phone})</p>
              <p className="text-gray-600">{order.shipping_address_line}</p>
              <p className="text-gray-500">{order.commune_name}, {order.wilaya_name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Paiement
              </span>
              <p className="font-bold text-gray-900">Paiement en espèces à la livraison (COD)</p>
              <p className="text-xs text-orange-600 font-extrabold">
                Montant total : {order.total_dzd.toLocaleString('fr-DZ')} DZD
              </p>
            </div>
          </div>

          {/* Line Items List */}
          {order.order_items && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Articles inclus ({order.order_items.length})
              </h3>
              <div className="divide-y divide-gray-100">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <p className="font-bold text-gray-900">{item.product_name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">SKU: {item.sku} • Qté: {item.quantity}</p>
                    </div>
                    <div className="font-bold text-gray-900">
                      {item.total_price_dzd.toLocaleString('fr-DZ')} DZD
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
