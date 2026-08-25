// HamzaPhone Checkout Page

import React from 'react';
import type { Metadata } from 'next';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { CheckoutShell } from '@/components/storefront/checkout/checkout-shell';

export const metadata: Metadata = {
  title: 'Passer la Commande (Paiement à la Livraison) | HamzaPhone',
  description: 'Finalisez votre commande de pièces détachées smartphone avec livraison rapide dans les 58 Wilayas et paiement en espèces à la réception.',
};

export default function CheckoutPage() {
  return (
    <StorefrontShell>
      <CheckoutShell />
    </StorefrontShell>
  );
}
