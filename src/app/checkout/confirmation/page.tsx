'use client';

// HamzaPhone Order Confirmation Page

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { OrderConfirmationView } from '@/components/storefront/checkout/order-confirmation-view';
import { Loader2 } from 'lucide-react';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const token = searchParams.get('token') || '';

  return <OrderConfirmationView orderNumber={orderNumber} trackingToken={token} />;
}

export default function ConfirmationPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      }>
        <ConfirmationContent />
      </Suspense>
    </StorefrontShell>
  );
}
