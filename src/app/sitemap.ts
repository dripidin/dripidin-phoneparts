import { MetadataRoute } from 'next';
import { createServerClient } from '@/lib/auth/server';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { resolveCanonicalBaseUrl } from '@/lib/seo/canonical';
import { DemoModeService } from '@/lib/demo/demo-mode.service';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * Dynamic XML Sitemap Generator
 * Fetches active public products, categories, and brands from database.
 * Strictly excludes private/transactional/auth paths and respects global seoIndexable toggle.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await StoreSettingsService.getStoreSettings();
  const modeRes = await DemoModeService.getEffectiveMode(settings);

  // If in DEMO mode or store owner disabled indexation, emit empty sitemap
  if (modeRes.isDemo || !settings.seoIndexable) {
    return [];
  }

  const baseUrl = resolveCanonicalBaseUrl(settings);
  const now = new Date();

  // 1. Static Indexable Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const supabase = await createServerClient({ getAll: () => [] });

    // Query active, publicly visible products
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      supabase
        .from('public_products')
        .select('slug, updated_at')
        .order('updated_at', { ascending: false })
        .limit(2000),
      supabase
        .from('categories')
        .select('slug, updated_at')
        .order('name', { ascending: true }),
      supabase
        .from('brands')
        .select('slug, updated_at')
        .order('name', { ascending: true }),
    ]);

    const rawProducts = (productsRes.data as Array<{ slug?: string; updated_at?: string }> | null) || [];
    const rawCategories = (categoriesRes.data as Array<{ slug?: string; updated_at?: string }> | null) || [];
    const rawBrands = (brandsRes.data as Array<{ slug?: string; updated_at?: string }> | null) || [];

    const productRoutes: MetadataRoute.Sitemap = rawProducts
      .filter((p): p is { slug: string; updated_at?: string } => Boolean(p.slug))
      .map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    const categoryRoutes: MetadataRoute.Sitemap = rawCategories
      .filter((c): c is { slug: string; updated_at?: string } => Boolean(c.slug))
      .map((c) => ({
        url: `${baseUrl}/categories/${c.slug}`,
        lastModified: c.updated_at ? new Date(c.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      }));

    const brandRoutes: MetadataRoute.Sitemap = rawBrands
      .filter((b): b is { slug: string; updated_at?: string } => Boolean(b.slug))
      .map((b) => ({
        url: `${baseUrl}/brands/${b.slug}`,
        lastModified: b.updated_at ? new Date(b.updated_at) : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      }));

    return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
  } catch (err) {
    console.error('[sitemap] Failed to query dynamic entities, returning static routes:', err);
    return staticRoutes;
  }
}
