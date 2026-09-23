import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { CartProvider } from '@/components/providers/cart-provider';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { generateThemeCssString } from '@/lib/settings/theme-generator';

import { resolveCanonicalBaseUrl } from '@/lib/seo/canonical';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await StoreSettingsService.getStoreSettings();
  const storeName = settings.storeName || 'DRIPIDIN';
  const siteTitle = settings.metaTitle || `${storeName} — ${settings.tagline || 'Boutique en ligne'}`;
  const siteDescription =
    settings.metaDescription ||
    settings.tagline ||
    `Bienvenue sur la boutique officielle ${storeName}. Commandez en ligne avec expédition rapide et service client dédié.`;
  const favicon = settings.faviconUrl || '/favicon.ico';
  const ogImage = settings.ogImageUrl || '/og-image.jpg';
  const keywords = settings.metaKeywords
    ? settings.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean)
    : [storeName.toLowerCase(), 'e-commerce', 'boutique en ligne'];

  const siteUrl = resolveCanonicalBaseUrl(settings);
  const twitterHandle = settings.twitterHandle?.trim() || undefined;

  return {
    title: {
      default: siteTitle,
      template: `%s | ${storeName}`,
    },
    description: siteDescription,
    keywords,
    authors: [{ name: storeName }, { name: settings.developerName || 'DRIPIDIN Platform' }],
    metadataBase: new URL(siteUrl),
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
    robots: {
      index: settings.seoIndexable,
      follow: settings.seoFollowLinks,
    },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: storeName,
      locale: settings.defaultLocale ? settings.defaultLocale.replace('-', '_') : 'fr_DZ',
      type: 'website',
      images: ogImage ? [{ url: ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}` }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
      images: ogImage ? [ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`] : undefined,
      site: twitterHandle,
      creator: twitterHandle,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await StoreSettingsService.getStoreSettings();
  const themeCss = generateThemeCssString(settings);
  const fontName = settings.fontFamily?.trim() || 'Inter';
  const googleFontParam = fontName.replace(/\s+/g, '+');
  const googleFontHref =
    googleFontParam === 'Inter'
      ? 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
      : `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=${googleFontParam}:wght@300;400;500;600;700;800;900&display=swap`;

  return (
    <html lang="fr" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={googleFontHref} />
        <style
          id="store-theme-tokens"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className="h-full antialiased bg-gray-50 text-gray-900">
        <QueryProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
