// HamzaPhone Product Detail Page (PDP) with Dynamic SEO, Gallery, Compatibility & Specs

import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { StorefrontService } from '@/lib/services/storefront.service';
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
  const { slug } = await props.params;
  const supabase = createServerClient();
  const service = new StorefrontService(supabase);
  const product = await service.getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Pièce Non Trouvée | HamzaPhone Algérie',
    };
  }

  const priceFormatted = `${product.effectivePriceDzd.toLocaleString('fr-DZ')} DZD`;
  const title = `${product.name} (${product.sku}) — ${priceFormatted}`;
  const description = product.shortDescription || `Achetez ${product.name} au meilleur prix en Algérie (${priceFormatted}). Pièce garantie et testée. Livraison 58 Wilayas en 24h-48h.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.mainImage ? [{ url: product.mainImage }] : [],
      type: 'article',
    },
  };
}

export default async function ProductDetailPage(props: ProductDetailPageProps) {
  const { slug } = await props.params;
  const supabase = createServerClient();
  const service = new StorefrontService(supabase);
  const product = await service.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.gallery,
    description: product.description || product.shortDescription || product.name,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'HamzaPhone',
    },
    offers: {
      '@type': 'Offer',
      url: `https://hamzaphone.dz/products/${product.slug}`,
      priceCurrency: 'DZD',
      price: product.effectivePriceDzd,
      availability: product.availableStock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <StorefrontShell>
      {/* Schema.org Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
