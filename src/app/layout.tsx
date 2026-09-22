import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { CartProvider } from '@/components/providers/cart-provider';
import { StoreSettingsService } from '@/lib/settings/store-settings.service';
import { generateThemeCssString } from '@/lib/settings/theme-generator';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await StoreSettingsService.getStoreSettings();
  const storeName = settings.storeName || 'DRIPIDIN';
  const siteTitle = settings.metaTitle || `${storeName} — Plateforme E-Commerce & Distribution Mobile en Algérie`;
  const siteDescription = settings.metaDescription || `Boutique en ligne ${storeName} : Smartphones, accessoires connectés, pièces et produits high-tech en Algérie. Vente en gros & détail avec livraison 58 Wilayas (COD).`;
  const favicon = settings.faviconUrl || '/favicon.ico';
  const ogImage = settings.ogImageUrl || '/og-image.jpg';
  const keywords = settings.metaKeywords
    ? settings.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean)
    : ['ecommerce algérie', 'smartphones algérie', 'accessoires high-tech', 'vente en gros mobile', 'livraison 58 wilayas'];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://drip-phones-parts.vercel.app';

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
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      siteName: storeName,
      locale: settings.defaultLocale || 'fr_DZ',
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
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

  return (
    <html lang="fr" className="h-full">
      <head>
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
