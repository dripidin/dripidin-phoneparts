'use client';

// HamzaPhone Checkout - Delivery Mode Step
// Supports Domicile (Home/Workshop) and Stopdesk Delivery across 58 Wilayas

import React from 'react';
import { Truck, Store, Clock, CheckCircle2 } from 'lucide-react';
import { DeliveryPricingService } from '@/lib/delivery/delivery-pricing.service';
import type { DeliveryType } from '@/types/database.types';

interface DeliveryStepProps {
  deliveryType: DeliveryType;
  setDeliveryType: (type: DeliveryType) => void;
  wilayaCode: number;
  wilayaName: string;
}

export function DeliveryStep({
  deliveryType,
  setDeliveryType,
  wilayaCode,
  wilayaName,
}: DeliveryStepProps) {
  const homePriceDzd = DeliveryPricingService.calculateDeliveryCost({ wilayaCode, deliveryType: 'HOME' }).finalCostDzd;
  const deskPriceDzd = DeliveryPricingService.calculateDeliveryCost({ wilayaCode, deliveryType: 'DESK' }).finalCostDzd;

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs space-y-4">
      
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
            3
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
              Mode de Livraison ({wilayaName || 'Algérie'})
            </h3>
            <p className="text-xs text-gray-500">
              Délais habituels : 24h à 48h selon votre Wilaya.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* Home / Workshop Delivery */}
        <div
          onClick={() => setDeliveryType('HOME')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            deliveryType === 'HOME'
              ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/20'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                deliveryType === 'HOME' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">
                  Livraison à Domicile / Atelier
                </h4>
                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>24h - 48h (Remise en mains propres)</span>
                </p>
              </div>
            </div>

            {deliveryType === 'HOME' && (
              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
            )}
          </div>

          <div className="text-right border-t border-gray-100 pt-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Tarif Wilaya {wilayaCode.toString().padStart(2, '0')}</span>
            <span className="text-xs sm:text-sm font-extrabold text-orange-600">
              {homePriceDzd.toLocaleString('fr-DZ')} DZD
            </span>
          </div>
        </div>

        {/* Desk / Point Relais */}
        <div
          onClick={() => setDeliveryType('DESK')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            deliveryType === 'DESK'
              ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/20'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                deliveryType === 'DESK' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">
                  Retrait au Bureau Stopdesk
                </h4>
                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Agence de messagerie locale</span>
                </p>
              </div>
            </div>

            {deliveryType === 'DESK' && (
              <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
            )}
          </div>

          <div className="text-right border-t border-gray-100 pt-2 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Tarif réduit Stopdesk</span>
            <span className="text-xs sm:text-sm font-extrabold text-orange-600">
              {deskPriceDzd.toLocaleString('fr-DZ')} DZD
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
