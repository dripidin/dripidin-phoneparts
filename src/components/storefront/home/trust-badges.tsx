'use client';

// HamzaPhone 4 Trust Pillars & Guarantees

import React from 'react';
import { Truck, ShieldCheck, Wrench, Sparkles } from 'lucide-react';

export function TrustBadges() {
  const pillars = [
    {
      icon: Truck,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      title: 'Livraison 58 Wilayas',
      description: 'Expédition rapide 24h/48h à domicile ou en point relais',
    },
    {
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      title: 'Paiement à la Livraison',
      description: 'Réglez en espèces (COD) après inspection du colis',
    },
    {
      icon: Wrench,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      title: 'Pièces 100% Testées',
      description: 'Écrans OLED et composants vérifiés avant expédition',
    },
    {
      icon: Sparkles,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      title: 'Tarifs Grossiste B2B',
      description: 'Remises dégressives pour ateliers et réparateurs',
    },
  ];

  return (
    <section className="py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {pillars.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 flex items-start gap-3 shadow-2xs hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${p.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                  {p.title}
                </h4>
                <p className="text-[11px] text-gray-500 leading-tight hidden sm:block">
                  {p.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
