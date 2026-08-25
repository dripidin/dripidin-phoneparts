'use client';

// HamzaPhone Homepage Hero Banner & Value Proposition

import React from 'react';
import Link from 'next/link';
import { 
  Smartphone, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  CheckCircle2, 
  Search,
  Wrench
} from 'lucide-react';
import { InstantSearchBar } from '@/components/storefront/search/instant-search-bar';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-orange-950 text-white p-6 sm:p-10 lg:p-14 shadow-2xl border border-gray-800">
      
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Headline & Search */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>N°1 de la pièce détachée smartphone en Algérie</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
              Toutes vos Pièces Smartphones,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">
                Livrées en 48h dans 58 Wilayas.
              </span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-300 max-w-xl leading-relaxed">
              Écrans OLED, batteries originales, connecteurs et outillage professionnel. Stock réel garanti pour particuliers et ateliers de réparation.
            </p>
          </div>

          {/* Large Hero Search Bar */}
          <div className="max-w-xl">
            <div className="text-[11px] font-bold text-orange-300 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Trouvez votre pièce immédiatement avant d&apos;appuyer sur Entrée :</span>
            </div>
            <InstantSearchBar isMobileFullWidth placeholder="Rechercher (ex: écran Samsung S22, batterie iPhone 13, A2633)..." />
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-500 text-white font-bold text-xs sm:text-sm hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
            >
              <span>Explorer tout le catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 text-white border border-white/15 hover:bg-white/20 font-bold text-xs sm:text-sm transition-all"
            >
              <Wrench className="w-4 h-4 text-orange-400" />
              <span>Espace Grossiste B2B</span>
            </Link>
          </div>

        </div>

        {/* Right Column: Trust Card Widget */}
        <div className="lg:col-span-5">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/15 space-y-4 shadow-xl">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
                Garantie HamzaPhone
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                100% Vérifié
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Livraison Express 58 Wilayas</h4>
                  <p className="text-gray-300 text-[11px]">Expédié sous 24h via EcoTrack & Yalidine avec suivi en direct.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">Paiement Cash à la Livraison (COD)</h4>
                  <p className="text-gray-300 text-[11px]">Payez en toute sécurité à la réception de votre colis.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white">+4 000 Références en Stock</h4>
                  <p className="text-gray-300 text-[11px]">Samsung, Apple, Xiaomi, Huawei, Oppo, Realme, Infinix, Tecno.</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 text-center">
              <span className="text-[11px] text-gray-400">
                Service client & assistance technique : <strong className="text-white">0550 00 00 00</strong>
              </span>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
}
