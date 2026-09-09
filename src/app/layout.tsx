import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { CartProvider } from '@/components/providers/cart-provider';

export const metadata: Metadata = {
  title: {
    default: 'DRIPIDIN — Plateforme E-Commerce & Distribution Mobile en Algérie',
    template: '%s | DRIPIDIN',
  },
  description: 'Boutique en ligne DRIPIDIN : Smartphones, accessoires connectés, pièces et produits high-tech en Algérie. Vente en gros & détail avec livraison rapide 58 Wilayas (COD).',
  keywords: ['dripidin', 'ecommerce algérie', 'smartphones algérie', 'accessoires high-tech', 'vente en gros mobile', 'livraison 58 wilayas'],
  authors: [{ name: 'DRIPIDIN' }, { name: 'Chagour Imed Eddine' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dripidin.vercel.app'),
  openGraph: {
    title: 'DRIPIDIN — Plateforme E-Commerce & Distribution Mobile en Algérie',
    description: 'Boutique en ligne & distribution mobile en Algérie. Vente en gros et détail avec livraison 58 Wilayas.',
    siteName: 'DRIPIDIN',
    locale: 'fr_DZ',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
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
