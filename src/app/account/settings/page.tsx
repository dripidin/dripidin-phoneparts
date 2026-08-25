// HamzaPhone Account Security Settings Page

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { SecurityForm } from '@/components/storefront/account/security-form';

export const metadata: Metadata = {
  title: 'Sécurité & Accès | HamzaPhone Algérie',
  description: 'Gérez la sécurité de votre compte et mettez à jour votre mot de passe.',
};

export default async function SettingsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/settings');
  }

  const service = new CustomerAccountService(supabase);
  const context = await service.getCustomerContext(user.id);

  if (!context) {
    redirect('/login?next=/account/settings');
  }

  return (
    <AccountShell context={context}>
      <SecurityForm />
    </AccountShell>
  );
}
