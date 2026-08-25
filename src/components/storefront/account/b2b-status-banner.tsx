'use client';

// HamzaPhone B2B Account Approval Status Banner

import React from 'react';
import { Clock, ShieldCheck, AlertTriangle, XCircle, PhoneCall, Sparkles } from 'lucide-react';
import type { B2BStatus } from '@/types/database.types';

interface B2BStatusBannerProps {
  status: B2BStatus | 'NONE';
  tierCode?: string;
  creditLimitDzd?: number;
}

export function B2BStatusBanner({ status, tierCode = 'TIER_1', creditLimitDzd = 0 }: B2BStatusBannerProps) {
  if (status === 'APPROVED') {
    return (
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200 text-emerald-950 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Compte Professionnel B2B Approuvé & Actif</span>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-xs shadow-2xs">
            Niveau : {tierCode}
          </span>
        </div>

        <p className="text-xs text-emerald-800 leading-relaxed">
          Vos tarifs grossiste dégressifs sont appliqués sur l&apos;ensemble du catalogue pièces détachées. Vous bénéficiez d&apos;un plafond d&apos;encours de <strong>{creditLimitDzd.toLocaleString('fr-DZ')} DZD</strong>.
        </p>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Dossier B2B en cours de validation par notre service commercial</span>
        </div>

        <p className="text-xs text-amber-900 leading-relaxed">
          Votre demande d&apos;ouverture de compte professionnel est en cours d&apos;étude. Nos équipes vérifient votre Registre de Commerce sous 24h à 48h. Vos prix grossiste s&apos;activeront automatiquement après validation.
        </p>

        <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-amber-800">
          <PhoneCall className="w-4 h-4 text-amber-600" />
          <span>Assistance commerciale directe : 0550 00 00 00</span>
        </div>
      </div>
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <div className="p-5 rounded-3xl bg-red-50 border border-red-200 text-red-950 space-y-2">
        <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <span>Compte B2B Temporairement Suspendu</span>
        </div>

        <p className="text-xs text-red-900 leading-relaxed">
          Votre compte professionnel est actuellement suspendu (dépassement d&apos;encours ou régularisation de facture requise). Veuillez contacter votre chargé de compte HamzaPhone.
        </p>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="p-5 rounded-3xl bg-gray-50 border border-gray-200 text-gray-800 space-y-2">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <XCircle className="w-5 h-5 text-gray-500 shrink-0" />
          <span>Dossier B2B Non Retenu</span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Votre demande d&apos;adhésion au programme grossiste n&apos;a pas pu être validée avec les pièces fournies. Vous pouvez continuer vos achats au tarif public ou soumettre un nouveau dossier conforme.
        </p>
      </div>
    );
  }

  return null;
}
