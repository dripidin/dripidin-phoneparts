// DRIPIDIN Customer Cart Page

import React from 'react';
import type { Metadata } from 'next';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CartPageView } from '@/components/storefront/cart/cart-page-view';

export const metadata: Metadata = {
  title: "Mon Panier d'Achats",
  description: 'Consultez les articles sélectionnés, ajustez vos quantités et finalisez votre commande.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return (
    <StorefrontShell>
      <CartPageView />
    </StorefrontShell>
  );
}
