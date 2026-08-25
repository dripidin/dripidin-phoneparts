// HamzaPhone Profile Settings Page

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { ProfileForm } from '@/components/storefront/account/profile-form';

export const metadata: Metadata = {
  title: 'Mon Profil | HamzaPhone Algérie',
  description: 'Mettez à jour vos informations personnelles et numéros de contact.',
};

export default async function ProfilePage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/profile');
  }

  const service = new CustomerAccountService(supabase);
  const context = await service.getCustomerContext(user.id);

  if (!context) {
    redirect('/login?next=/account/profile');
  }

  return (
    <AccountShell context={context}>
      <ProfileForm context={context} />
    </AccountShell>
  );
}
