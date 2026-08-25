'use client';

// HamzaPhone High-Converting B2B Wholesale Banner

import React from 'react';
import Link from 'next/link';
import { Sparkles, Building2, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export function B2BCtaBanner() {
  return (
    <section className="my-8 rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-6 sm:p-10 shadow-xl overflow-hidden relative">
      
      {/* Background patterns */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        <div className="lg:col-span-8 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ESPACE PRO & ATELIERS DE RÉPARATION</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
            Vous êtes réparateur ou revendeur ? Bénéficiez de nos prix grossiste B2B.
          </h2>

          <p className="text-xs sm:text-sm text-orange-100 max-w-2xl leading-relaxed">
            Accédez à notre grille tarifaire dégressive par volume, facilités de paiement, facturation conforme (RC/NIF/NIS) et livraisons prioritaires dans les 58 Wilayas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-xs font-semibold text-white">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 shrink-0" />
              <span>Remises dégressives jusqu&apos;à -30%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 shrink-0" />
              <span>Facture conforme RC & NIF</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-orange-200 shrink-0" />
              <span>Support technique dédié</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gray-950 text-white font-extrabold text-xs sm:text-sm hover:bg-black transition-all shadow-lg active:scale-95 text-center"
          >
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>Créer un Compte B2B</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="tel:+213550000000"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/20 text-white border border-white/25 font-bold text-xs sm:text-sm hover:bg-white/30 transition-all text-center"
          >
            <span>Contacter le service commercial</span>
          </a>
        </div>

      </div>

    </section>
  );
}
