'use client';

// HamzaPhone Dual-Verification Guest Order Tracking Page

import React, { Suspense } from 'react';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { GuestTrackingView } from '@/components/storefront/checkout/guest-tracking-view';
import { Loader2 } from 'lucide-react';

export default function TrackOrderPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      }>
        <GuestTrackingView />
      </Suspense>
    </StorefrontShell>
  );
}
