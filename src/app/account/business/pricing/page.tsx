// HamzaPhone Customer B2B Wholesale Pricing Page

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { B2BPricingTable } from '@/components/storefront/account/b2b-pricing-table';

export const metadata: Metadata = {
  title: 'Tarifs Grossiste B2B | HamzaPhone Algérie',
  description: 'Grille tarifaire dégressive réservée aux ateliers et grossistes en pièces de smartphones.',
};

export default async function BusinessPricingPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/business/pricing');
  }

  const service = new CustomerAccountService(supabase);
  const context = await service.getCustomerContext(user.id);

  if (!context) {
    redirect('/login?next=/account/business/pricing');
  }

  return (
    <AccountShell context={context}>
      <B2BPricingTable />
    </AccountShell>
  );
}
