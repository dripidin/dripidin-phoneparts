// DRIPIDIN Storefront Homepage: Hero, Categories, Featured Products, Brands & B2B

import React from 'react';
import type { Metadata } from 'next';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { HeroSection } from '@/components/storefront/home/hero-section';
import { TrustBadges } from '@/components/storefront/home/trust-badges';
import { CategoryGrid } from '@/components/storefront/home/category-grid';
import { FeaturedRail } from '@/components/storefront/home/featured-rail';
import { BrandStrip } from '@/components/storefront/home/brand-strip';
import { B2BCtaBanner } from '@/components/storefront/home/b2b-cta-banner';
import { ReviewsSection } from '@/components/storefront/home/reviews-section';

import {
  resolveHomeMetadata,
  buildWebSiteJsonLd,
  buildOrganizationJsonLd,
  serializeJsonLd,
  resolveCanonicalBaseUrl,
} from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await StoreSettingsService.getStoreSettings();
  return resolveHomeMetadata(settings);
}

export default async function StorefrontHomePage() {
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  const [data, settings] = await Promise.all([
    service.getHomepageData(),
    StoreSettingsService.getStoreSettings(),
  ]);

  const baseUrl = resolveCanonicalBaseUrl(settings);
  const websiteJsonLd = buildWebSiteJsonLd(settings, baseUrl);
  const orgJsonLd = buildOrganizationJsonLd(settings, baseUrl);

  return (
    <StorefrontShell>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgJsonLd) }}
      />

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
