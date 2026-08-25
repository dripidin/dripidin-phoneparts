'use client';

// HamzaPhone Checkout - Payment Method Step
// Default: Cash on Delivery (COD) with Extensible Architecture for Future Online Gateways

import React from 'react';
import { Banknote, CreditCard, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import type { PaymentMethod } from '@/types/database.types';

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  isApprovedB2B?: boolean;
}

export function PaymentStep({
  paymentMethod,
  setPaymentMethod,
  isApprovedB2B = false,
}: PaymentStepProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs space-y-4">
      
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
            4
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
              Mode de Paiement
            </h3>
            <p className="text-xs text-gray-500">
              Paiement sécurisé adapté au marché algérien.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        
        {/* Cash on Delivery (COD) - Default active */}
        <div
          onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            paymentMethod === 'CASH_ON_DELIVERY'
              ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/20'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">
                  Paiement en Espèces à la Livraison (Cash on Delivery)
                </h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Recommandé
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Vous payez le montant exact en dinars directement au livreur lors de la réception de vos pièces.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {paymentMethod === 'CASH_ON_DELIVERY' && (
              <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
            )}
          </div>
        </div>

        {/* B2B Credit Line (for approved B2B accounts) */}
        {isApprovedB2B && (
          <div
            onClick={() => setPaymentMethod('B2B_CREDIT_ACCOUNT')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              paymentMethod === 'B2B_CREDIT_ACCOUNT'
                ? 'border-orange-500 bg-orange-50/40 shadow-xs ring-2 ring-orange-500/20'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CreditCard className="w-5 h-5" />
              </div>

              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">
                  Compte Crédit Atelier B2B
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Débité sur votre ligne de crédit entreprise selon vos conditions commerciales.
                </p>
              </div>
            </div>

            {paymentMethod === 'B2B_CREDIT_ACCOUNT' && (
              <CheckCircle2 className="w-5 h-5 text-orange-600 shrink-0" />
            )}
          </div>
        )}

        {/* Online Payment (CIB / EDAHABIA - Future Integration Placeholder) */}
        <div className="p-4 rounded-2xl border border-gray-200/60 bg-gray-50/60 opacity-70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-gray-700">
                  Carte CIB / Edahabia (Paiement en ligne)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                  Bientôt disponible
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Intégration bancaire SATIM / GIE Monétique en cours de certification.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Safety Notice */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Toutes vos commandes bénéficient de la garantie vérification avant paiement.</span>
      </div>

    </div>
  );
}
