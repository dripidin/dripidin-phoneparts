// HamzaPhone Forgot Password Page

import React from 'react';
import type { Metadata } from 'next';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { ForgotPasswordForm } from '@/components/storefront/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Mot de Passe Oublié | HamzaPhone Algérie',
  description: 'Réinitialisez votre mot de passe pour accéder à votre compte HamzaPhone.',
};

export default function ForgotPasswordPage() {
  return (
    <StorefrontShell>
      <div className="py-6 sm:py-12 flex items-center justify-center">
        <ForgotPasswordForm />
      </div>
    </StorefrontShell>
  );
}
