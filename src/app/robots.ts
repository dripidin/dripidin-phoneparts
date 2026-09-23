import { MetadataRoute } from 'next';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { resolveCanonicalBaseUrl } from '@/lib/seo/canonical';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * Dynamic Next.js robots.txt Route Handler
 * Respects store-level indexability toggle (seoIndexable) and protects private administrative/transactional routes.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await StoreSettingsService.getStoreSettings();
  const baseUrl = resolveCanonicalBaseUrl(settings);

  // If store is globally set to not indexable (e.g. staging or owner toggle)
  if (!settings.seoIndexable) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  }

  // Normal indexable production storefront
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/account/',
          '/checkout/',
          '/cart/',
          '/api/',
          '/forgot-password/',
          '/track-order/',
          '/search',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
