// HamzaPhone Customer B2B Business Dashboard Page

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { B2BBusinessView } from '@/components/storefront/account/b2b-business-view';

export const metadata: Metadata = {
  title: 'Espace Entreprise B2B | HamzaPhone Algérie',
  description: 'Gérez votre compte professionnel atelier, vos encours et vos documents fiscaux.',
};

export default async function BusinessPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/business');
  }

  const service = new CustomerAccountService(supabase);
  const context = await service.getCustomerContext(user.id);

  if (!context) {
    redirect('/login?next=/account/business');
  }

  return (
    <AccountShell context={context}>
      <B2BBusinessView context={context} />
    </AccountShell>
  );
}
