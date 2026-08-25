// HamzaPhone Customer Single Order Detail Page

import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createServerClient } from '@/lib/auth/server';
import { CustomerAccountService } from '@/lib/services/customer-account.service';
import { AccountShell } from '@/components/storefront/account/account-shell';
import { OrderDetailView } from '@/components/storefront/account/order-detail-view';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(props: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await props.params;
  return {
    title: `Détails Commande | HamzaPhone Algérie`,
    description: `Consultez les détails et le suivi d'expédition de votre commande.`,
  };
}

export default async function OrderDetailPage(props: OrderDetailPageProps) {
  const { id } = await props.params;
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/account/orders/${id}`);
  }

  const service = new CustomerAccountService(supabase);
  const [context, order] = await Promise.all([
    service.getCustomerContext(user.id),
    service.getOrderById(user.id, id),
  ]);

  if (!context) {
    redirect(`/login?next=/account/orders/${id}`);
  }

  if (!order) {
    notFound();
  }

  return (
    <AccountShell context={context}>
      <OrderDetailView order={order} />
    </AccountShell>
  );
}
