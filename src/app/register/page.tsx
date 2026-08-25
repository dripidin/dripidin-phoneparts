'use client';

// HamzaPhone Customer & B2B Registration Page with Tab Toggle

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { User, Building2, Sparkles, Loader2 } from 'lucide-react';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { RegisterB2CForm } from '@/components/storefront/auth/register-b2c-form';
import { RegisterB2BForm } from '@/components/storefront/auth/register-b2b-form';

function RegisterContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') === 'b2b' ? 'B2B' : 'B2C';
  const [accountType, setAccountType] = useState<'B2C' | 'B2B'>(initialType);

  return (
    <div className="py-6 sm:py-12 max-w-xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-extrabold border border-orange-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nouveau Client HamzaPhone</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Créer un Compte
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Choisissez le type de compte correspondant à vos besoins en Algérie.
        </p>
      </div>

      {/* Account Type Segmented Switch */}
      <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setAccountType('B2C')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            accountType === 'B2C'
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className="w-4 h-4 text-orange-500" />
          <span>Client Particulier</span>
        </button>

        <button
          type="button"
          onClick={() => setAccountType('B2B')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
            accountType === 'B2B'
              ? 'bg-orange-500 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Atelier / Grossiste B2B</span>
        </button>
      </div>

      {/* Registration Form Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-xl">
        {accountType === 'B2C' ? <RegisterB2CForm /> : <RegisterB2BForm />}

        <div className="pt-6 mt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-600">
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="font-bold text-orange-600 hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <StorefrontShell>
      <Suspense fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </StorefrontShell>
  );
}
