import { MetadataRoute } from 'next';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { resolveCanonicalBaseUrl } from '@/lib/seo/canonical';
import { DemoModeService } from '@/lib/demo/demo-mode.service';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

/**
 * Dynamic Next.js robots.txt Route Handler
 * Respects store-level indexability toggle (seoIndexable) and protects private administrative/transactional routes.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await StoreSettingsService.getStoreSettings();
  const baseUrl = resolveCanonicalBaseUrl(settings);
  const modeRes = await DemoModeService.getEffectiveMode(settings);

  // In DEMO sandbox mode or when explicitly toggled off by owner
  if (modeRes.isDemo || !settings.seoIndexable) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
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
