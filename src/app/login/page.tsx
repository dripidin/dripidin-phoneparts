// HamzaPhone Customer Login Page

import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { LoginForm } from '@/components/storefront/auth/login-form';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Connexion Client & Espace Pro | HamzaPhone Algérie',
  description: 'Connectez-vous à votre espace client ou atelier pour suivre vos commandes et accéder à vos tarifs.',
};

export default function LoginPage() {
  return (
    <StorefrontShell>
      <div className="py-6 sm:py-12 flex items-center justify-center">
        <Suspense fallback={
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </StorefrontShell>
  );
}
