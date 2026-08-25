// HamzaPhone Customer Cart Page

import React from 'react';
import type { Metadata } from 'next';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CartPageView } from '@/components/storefront/cart/cart-page-view';

export const metadata: Metadata = {
  title: 'Mon Panier d\'Achats | HamzaPhone Algérie',
  description: 'Consultez les articles sélectionnés, ajustez vos quantités et calculez les frais de livraison dans les 58 Wilayas.',
};

export default function CartPage() {
  return (
    <StorefrontShell>
      <CartPageView />
    </StorefrontShell>
  );
}
