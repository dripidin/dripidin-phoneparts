// DRIPIDIN Product Detail Page (PDP) with Dynamic SEO, Gallery, Compatibility & Specs

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import {
  resolveProductMetadata,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  resolveCanonicalBaseUrl,
} from '@/lib/seo';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { ProductGallery } from '@/components/storefront/product-detail/product-gallery';
import { ProductInfo } from '@/components/storefront/product-detail/product-info';
import { CompatibilityTable } from '@/components/storefront/product-detail/compatibility-table';
import { SpecificationsTable } from '@/components/storefront/product-detail/specifications-table';
import { RelatedProducts } from '@/components/storefront/product-detail/related-products';

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(props: ProductDetailPageProps): Promise<Metadata> {
  try {
    const { slug } = await props.params;
    const supabase = await createServerClient();
    const service = new StorefrontService(supabase);
    const [product, settings] = await Promise.all([
      service.getProductBySlug(slug),
      StoreSettingsService.getStoreSettings(),
    ]);

    if (!product) {
      return {
        title: 'Produit Non Trouvé',
      };
    }

    return resolveProductMetadata(product, settings);
  } catch (err) {
    console.error('[ProductDetailPage.generateMetadata] Error:', err);
    return {
      title: 'Détail Produit',
    };
  }
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  const { slug } = await props.params;
  const supabase = await createServerClient();
  const service = new StorefrontService(supabase);
  const [product, settings] = await Promise.all([
    service.getProductBySlug(slug),
    StoreSettingsService.getStoreSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const baseUrl = resolveCanonicalBaseUrl(settings);
  const productJsonLd = buildProductJsonLd(product, settings, baseUrl);

  const breadcrumbs = [
    { name: 'Accueil', url: '/' },
    { name: 'Produits', url: '/products' },
  ];
  if (product.category?.name && product.category?.slug) {
    breadcrumbs.push({
      name: product.category.name,
      url: `/categories/${product.category.slug}`,
    });
  }
  breadcrumbs.push({
    name: product.name,
    url: `/products/${product.slug}`,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbs, baseUrl);

  return (
    <StorefrontShell>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />

      <div className="space-y-8 sm:space-y-12">
        {/* Top Product Hero: Gallery + Purchase Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left: Gallery */}
          <div className="lg:col-span-6">
            <ProductGallery
              images={product.gallery}
              productName={product.name}
              isFeatured={product.isFeatured}
              isOnSale={product.isOnSale}
            />
          </div>

          {/* Right: Info & CTA Card */}
          <div className="lg:col-span-6">
            <ProductInfo product={product} />
          </div>

        </div>

        {/* Compatibility Matrix */}
        <CompatibilityTable product={product} />

        {/* Specifications & Technical Details */}
        <SpecificationsTable product={product} />

        {/* Related Products Rail */}
        <RelatedProducts
          products={product.relatedProducts}
          categoryName={product.category?.name}
        />
      </div>
    </StorefrontShell>
  );
}
