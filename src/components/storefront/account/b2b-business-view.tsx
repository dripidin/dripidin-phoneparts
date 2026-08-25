'use client';

// HamzaPhone B2B Business Profile Overview & Commercial Dashboard

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CreditCard, 
  MapPin, 
  Phone, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import type { CustomerContext } from '@/lib/services/customer-account.service';
import { B2BStatusBanner } from './b2b-status-banner';

interface B2BBusinessViewProps {
  context: CustomerContext;
}

export function B2BBusinessView({ context }: B2BBusinessViewProps) {
  const b = context.business;

  if (!b) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-8 text-center space-y-4 shadow-xs">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
        <h2 className="text-base font-bold text-gray-900">Aucune entreprise associée</h2>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          Vous n&apos;avez pas encore de compte professionnel B2B enregistré.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 text-white font-bold text-xs shadow-md"
        >
          <span>Créer un compte B2B</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Status Banner */}
      <B2BStatusBanner
        status={b.status}
        tierCode={b.tierCode}
        creditLimitDzd={b.creditLimitDzd}
      />

      {/* 2. Business Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Credit Limit Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <CreditCard className="w-4 h-4 text-orange-500" />
            <span>Plafond d&apos;encours</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-gray-900">
            {b.creditLimitDzd.toLocaleString('fr-DZ')} DZD
          </div>
          <span className="text-[11px] text-gray-400 block">
            Facilités de paiement B2B
          </span>
        </div>

        {/* Current Balance */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Solde / Encours Actuel</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600">
            {b.currentBalanceDzd.toLocaleString('fr-DZ')} DZD
          </div>
          <span className="text-[11px] text-gray-400 block">
            Factures en cours de règlement
          </span>
        </div>

        {/* Wholesale Tier */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Grille Tarifaire</span>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-purple-700">
            {b.tierCode}
          </div>
          {context.canAccessWholesalePrices ? (
            <Link href="/account/business/pricing" className="text-[11px] font-bold text-orange-600 hover:underline block">
              Voir la grille des tarifs grossiste →
            </Link>
          ) : (
            <span className="text-[11px] text-gray-400 block">Actif après validation</span>
          )}
        </div>

      </div>

      {/* 3. Detailed Legal / Commercial Information */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Renseignements Juridiques & Fiscaux (Algérie)
            </h3>
            <p className="text-xs text-gray-500">
              Conformité pour l&apos;émission de vos factures professionnelles.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block text-[11px]">Raison Sociale</span>
            <strong className="text-gray-900 font-bold text-sm">{b.name}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block text-[11px]">Nom Commercial / Enseigne</span>
            <strong className="text-gray-900 font-bold text-sm">{b.tradeName || '—'}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block text-[11px]">N° Registre de Commerce (RC)</span>
            <strong className="text-gray-900 font-mono font-bold">{b.rcNumber || '—'}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block text-[11px]">N° Identifiant Fiscal (NIF)</span>
            <strong className="text-gray-900 font-mono font-bold">{b.nif || '—'}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block text-[11px]">N° NIS / Statistique</span>
            <strong className="text-gray-900 font-mono font-bold">{b.nis || '—'}</strong>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <span className="text-gray-400 font-medium block text-[11px]">Article d&apos;imposition</span>
            <strong className="text-gray-900 font-mono font-bold">{b.articleImposition || '—'}</strong>
          </div>

        </div>

        {/* Location */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3 text-xs">
          <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-gray-900 font-bold block mb-0.5">
              Siège / Atelier de Réparation
            </strong>
            <p className="text-gray-600">{b.addressLine || 'Adresse enregistrée'}</p>
            <p className="text-gray-800 font-semibold">
              {b.communeName}, Wilaya {b.wilayaCode.toString().padStart(2, '0')} - {b.wilayaName}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
