// HamzaPhone Customer Addresses Page

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { AddressesView } from '@/components/storefront/account/addresses-view';

export const metadata: Metadata = {
  title: 'Mes Adresses | HamzaPhone Algérie',
  description: 'Gérez vos adresses de livraison dans les 58 Wilayas d\'Algérie.',
};

export default async function AddressesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/addresses');
  }

  const service = new CustomerAccountService(supabase);
  const [context, addresses] = await Promise.all([
    service.getCustomerContext(user.id),
    service.getAddresses(user.id),
  ]);

  if (!context) {
    redirect('/login?next=/account/addresses');
  }

  return (
    <AccountShell context={context}>
      <AddressesView initialAddresses={addresses} />
    </AccountShell>
  );
}
