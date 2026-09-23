// DRIPIDIN Checkout Page

import React from 'react';
import type { Metadata } from 'next';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CheckoutShell } from '@/components/storefront/checkout/checkout-shell';

export const metadata: Metadata = {
  title: 'Passer la Commande (Paiement à la Livraison)',
  description: 'Finalisez votre commande en toute sécurité avec livraison et options de paiement flexibles.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <StorefrontShell>
      <CheckoutShell />
    </StorefrontShell>
  );
}
