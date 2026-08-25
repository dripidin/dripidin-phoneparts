import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/components/providers/query-provider';
import { CartProvider } from '@/components/providers/cart-provider';

export const metadata: Metadata = {
  title: {
    default: 'HamzaPhone — N°1 des Pièces Détachées Smartphones en Algérie',
    template: '%s | HamzaPhone Algérie',
  },
  description: 'Vente en gros et détail de pièces détachées smartphones en Algérie (Écrans OLED, Batteries, Connecteurs). Livraison 58 Wilayas avec paiement à la livraison (COD).',
  keywords: ['pièces détachées smartphone algérie', 'écran samsung algérie', 'écran iphone alger', 'batterie téléphone dz', 'grossiste pièces smartphone algerie', 'hamzaphone'],
  authors: [{ name: 'HamzaPhone' }],
  metadataBase: new URL('https://hamzaphone.dz'),
  openGraph: {
    title: 'HamzaPhone — N°1 des Pièces Détachées Smartphones en Algérie',
    description: 'Vente en gros et détail de pièces détachées smartphones en Algérie (58 Wilayas).',
    siteName: 'HamzaPhone',
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
