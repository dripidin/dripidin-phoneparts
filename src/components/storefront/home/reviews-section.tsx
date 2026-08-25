'use client';

// HamzaPhone Social Proof & Technician Reviews Section

import React from 'react';
import { Star, CheckCircle2, Quote, MapPin } from 'lucide-react';

export function ReviewsSection() {
  const reviews = [
    {
      author: 'Karim B.',
      shop: 'Atelier Phone Express',
      city: 'Alger (Kouba)',
      rating: 5,
      comment: 'Excellent fournisseur de pièces. Les écrans OLED Samsung sont 100% conformes et le SAV est irréprochable. Livraison en 24h chrono avec EcoTrack.',
      part: 'Écran OLED Samsung S21 & Batteries iPhone',
    },
    {
      author: 'Mourad T.',
      shop: 'Tech Mobile Oran',
      city: 'Oran (Centre-ville)',
      rating: 5,
      comment: 'En tant que réparateur pro, je commande toutes mes nappes et batteries chez HamzaPhone. Prix B2B imbattables et emballage très sécurisé.',
      part: 'Batteries Apple & Connecteurs Type-C',
    },
    {
      author: 'Sofiane L.',
      shop: 'Réparation Mobile 25',
      city: 'Constantine',
      rating: 5,
      comment: 'Le système de recherche instantanée permet de trouver la bonne référence de pièce avec le code variante en quelques secondes. Très professionnel.',
      part: 'Vitres & Châssis Redmi Note',
    },
  ];

  return (
    <section className="space-y-4 py-6">
      <div className="text-center space-y-1 max-w-xl mx-auto mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Avis Vérifiés des Réparateurs</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
          Ils nous font confiance dans 58 Wilayas
        </h2>
        <p className="text-xs text-gray-500">
          Plus de 1 500 ateliers de réparation et techniciens smartphone partenaires en Algérie.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <Quote className="w-5 h-5 text-gray-200" />
              </div>

              <p className="text-xs text-gray-700 leading-relaxed italic">
                « {r.comment} »
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-900">{r.author}</span>
                <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-500" />
                  {r.city}
                </span>
              </div>
              <div className="text-[11px] text-orange-600 font-semibold truncate">
                {r.shop} • <span className="text-gray-400">{r.part}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
