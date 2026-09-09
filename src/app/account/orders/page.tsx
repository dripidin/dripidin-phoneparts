// HamzaPhone Customer Orders List Page

import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { OrderHistoryList } from '@/components/storefront/account/order-history-list';

export const metadata: Metadata = {
  title: 'Mes Commandes | HamzaPhone Algérie',
  description: 'Consultez vos commandes et suivez l\'état de vos colis dans les 58 Wilayas.',
};

export default async function OrdersPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/account/orders');
  }

  const service = new CustomerAccountService(supabase);
  const [context, orders] = await Promise.all([
    service.getCustomerContext(user.id),
    service.getOrders(user.id),
  ]);

  if (!context) {
    redirect('/login?next=/account/orders');
  }

  return (
    <AccountShell context={context}>
      <OrderHistoryList orders={orders} />
    </AccountShell>
  );
}
