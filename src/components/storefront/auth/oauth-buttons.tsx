'use client';

// HamzaPhone Social OAuth Buttons (Google, Facebook, Apple)

import React, { useState } from 'react';
import { createClient } from '@/lib/auth/client';
import { Loader2 } from 'lucide-react';

interface OAuthButtonsProps {
  redirectTo?: string;
}

export function OAuthButtons({ redirectTo }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    try {
      setLoadingProvider(provider);
      setErrorMsg(null);
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback${
        redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''
      }`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setErrorMsg(`Erreur de connexion ${provider}: ${error.message}`);
        setLoadingProvider(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur inattendue');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Google */}
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={Boolean(loadingProvider)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition-all shadow-2xs hover:border-gray-300 disabled:opacity-50"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          onClick={() => handleOAuth('facebook')}
          disabled={Boolean(loadingProvider)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-blue-600 bg-[#1877F2] hover:bg-[#166FE5] text-xs font-bold text-white transition-all shadow-2xs disabled:opacity-50"
        >
          {loadingProvider === 'facebook' ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          <span>Facebook</span>
        </button>

        {/* Apple */}
        <button
          type="button"
          onClick={() => handleOAuth('apple')}
          disabled={Boolean(loadingProvider)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-900 bg-gray-950 hover:bg-black text-xs font-bold text-white transition-all shadow-2xs disabled:opacity-50"
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.65-.79 1.09-1.89.97-2.99-1 .04-2.15.65-2.82 1.44-.58.68-1.1 1.77-.96 2.87 1.11.08 2.19-.55 2.81-1.32z" />
            </svg>
          )}
          <span>Apple</span>
        </button>
      </div>
    </div>
  );
}
