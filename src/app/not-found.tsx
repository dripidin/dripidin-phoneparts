// HamzaPhone 404 Not Found Page

import React from 'react';
import Link from 'next/link';
import { Smartphone, ArrowRight, Search, Home } from 'lucide-react';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { InstantSearchBar } from '@/components/storefront/search/instant-search-bar';

export default function NotFoundPage() {
  return (
    <StorefrontShell>
      <div className="py-16 sm:py-24 text-center max-w-xl mx-auto space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
          <Smartphone className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
            Erreur 404
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Page ou Pièce Introuvable
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            La pièce détachée ou la page que vous recherchez n&apos;existe pas ou a été déplacée. Utilisez la recherche ci-dessous pour trouver votre modèle.
          </p>
        </div>

        <div className="pt-2">
          <InstantSearchBar isMobileFullWidth placeholder="Rechercher votre modèle (ex: Samsung A52, iPhone 12)..." />
        </div>

        <div className="flex items-center justify-center gap-3 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-md"
          >
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </Link>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            Voir tout le catalogue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}
