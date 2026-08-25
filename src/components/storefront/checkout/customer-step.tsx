'use client';

// HamzaPhone Checkout - Customer Contact Step
// Handles both Guest and Authenticated Customers

import React from 'react';
import Link from 'next/link';
import { User, Mail, Phone, ShieldCheck, CheckCircle2, Sparkles } from 'lucide-react';
import type { CustomerContext } from '@/lib/services/customer-account.service';

interface CustomerStepProps {
  customerContext: CustomerContext | null;
  guestEmail: string;
  setGuestEmail: (email: string) => void;
  guestName: string;
  setGuestName: (name: string) => void;
  guestPhone: string;
  setGuestPhone: (phone: string) => void;
  guestPhoneSecondary: string;
  setGuestPhoneSecondary: (phone: string) => void;
}

export function CustomerStep({
  customerContext,
  guestEmail,
  setGuestEmail,
  guestName,
  setGuestName,
  guestPhone,
  setGuestPhone,
  guestPhoneSecondary,
  setGuestPhoneSecondary,
}: CustomerStepProps) {
  // If user is authenticated
  if (customerContext) {
    const isB2B = customerContext.userType === 'B2B';
    const isApproved = customerContext.canAccessWholesalePrices;

    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
              Informations du Client
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-full font-bold border border-green-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Connecté</span>
          </div>
        </div>

        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-gray-900">
                {customerContext.fullName || 'Client HamzaPhone'}
              </span>
              {isB2B && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isApproved ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'
                }`}>
                  {isApproved ? 'Atelier B2B Approuvé' : 'Atelier B2B'}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 flex items-center gap-3 flex-wrap">
              <span>{customerContext.email}</span>
              {customerContext.phone && (
                <span>• {customerContext.phone}</span>
              )}
            </p>
          </div>

          <div className="text-xs text-gray-400">
            Commande associée à votre compte
          </div>
        </div>
      </div>
    );
  }

  // If user is a Guest visitor
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-7 shadow-xs space-y-5">
      
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
            1
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">
              Vos Coordonnées (Commande Invité)
            </h3>
            <p className="text-xs text-gray-500">
              Aucun compte obligatoire. Renseignez vos informations pour la livraison.
            </p>
          </div>
        </div>

        <Link
          href="/login?next=/checkout"
          className="text-xs font-extrabold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors shrink-0"
        >
          Déjà un compte ? Se connecter
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Full Name */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>Nom et Prénom du destinataire *</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Mohamed Benali"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Primary Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-orange-500" />
            <span>Numéro de Téléphone Principal *</span>
          </label>
          <input
            type="tel"
            required
            placeholder="0550123456"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
          <p className="text-[11px] text-gray-400">Pour la confirmation et le livreur (05/06/07...)</p>
        </div>

        {/* Secondary Phone */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span>Numéro Secondaire (Optionnel)</span>
          </label>
          <input
            type="tel"
            placeholder="0770987654"
            value={guestPhoneSecondary}
            onChange={(e) => setGuestPhoneSecondary(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span>Adresse Email (Optionnelle pour recevoir le suivi)</span>
          </label>
          <input
            type="email"
            placeholder="mohamed@example.com"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

      </div>

    </div>
  );
}
