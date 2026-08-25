'use client';

// HamzaPhone Global Application Error Boundary
// User-friendly fallback without leaking internal stack traces or database errors

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log sanitized error in client console without exposing secrets
    console.error('HamzaPhone Application Error:', error.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-xs space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
            Erreur Système
          </span>
          <h2 className="text-xl font-bold text-gray-900">
            Une erreur inattendue est survenue
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            Nos équipes techniques ont été notifiées. Vous pouvez tenter de recharger l&apos;application ou retourner à l&apos;accueil.
          </p>
          {error.digest && (
            <p className="text-[10px] text-gray-400 font-mono pt-1">
              Code incident : {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Réessayer
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
          >
            <Home className="w-3.5 h-3.5" />
            Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
