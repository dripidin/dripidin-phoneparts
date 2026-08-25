'use client';

// HamzaPhone Cart Validation Warnings Banner

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface CartWarningsProps {
  warnings: string[];
  onDismiss?: () => void;
}

export function CartWarnings({ warnings, onDismiss }: CartWarningsProps) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-amber-900 space-y-2 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
            Mise à jour de votre panier ({warnings.length})
          </h4>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-amber-500 hover:text-amber-800 p-1 rounded-lg transition-colors"
            aria-label="Fermer les avertissements"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <ul className="list-disc list-inside text-xs space-y-1 text-amber-800/90 pl-1">
        {warnings.map((msg, index) => (
          <li key={index} className="leading-relaxed">
            {msg}
          </li>
        ))}
      </ul>
    </div>
  );
}
