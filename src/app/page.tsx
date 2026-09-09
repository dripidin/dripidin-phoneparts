// HamzaPhone Storefront Homepage: Hero, Categories, Featured Products, Brands & B2B

import React from 'react';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { HeroSection } from '@/components/storefront/home/hero-section';
import { TrustBadges } from '@/components/storefront/home/trust-badges';
import { CategoryGrid } from '@/components/storefront/home/category-grid';
import { FeaturedRail } from '@/components/storefront/home/featured-rail';
import { BrandStrip } from '@/components/storefront/home/brand-strip';
import { B2BCtaBanner } from '@/components/storefront/home/b2b-cta-banner';
import { ReviewsSection } from '@/components/storefront/home/reviews-section';

export const metadata: Metadata = {
  title: 'HamzaPhone — N°1 des Pièces Détachées Smartphones en Algérie (58 Wilayas)',
  description: 'Écrans OLED Samsung & iPhone, batteries haute capacité, connecteurs de charge, outillage professionnel. Vente en gros & détail avec livraison 58 Wilayas COD.',
};

export default async function StorefrontHomePage() {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  const data = await service.getHomepageData();

  return (
    <StorefrontShell>
      <div className="space-y-8 sm:space-y-12">
        {/* 1. Hero Banner with Instant Search */}
        <HeroSection />

        {/* 2. 4 Trust Guarantees */}
        <TrustBadges />

        {/* 3. Visual Categories Grid */}
        <CategoryGrid categories={data.categories} />

        {/* 4. Featured Popular Products Rail */}
        <FeaturedRail
          title="Pièces Populaires & Meilleures Ventes"
          subtitle="Les écrans OLED, batteries et composants les plus demandés par les ateliers ce mois."
          products={data.featuredProducts}
          badgeText="Sélection Top Ventes"
          isHot
        />

        {/* 5. High-Impact B2B Wholesale Banner */}
        <B2BCtaBanner />

        {/* 6. New Arrivals Products Rail */}
        <FeaturedRail
          title="Nouveaux Arrivages en Stock"
          subtitle="Dernières pièces et accessoires compatibles récemment ajoutés au catalogue."
          products={data.newArrivals}
          badgeText="Arrivages Récents"
          viewAllHref="/products?sortBy=newest"
        />

        {/* 7. Supported Smartphone Brands */}
        <BrandStrip brands={data.brands} />

        {/* 8. Technician Testimonials & Social Proof */}
        <ReviewsSection />
      </div>
    </StorefrontShell>
  );
}
