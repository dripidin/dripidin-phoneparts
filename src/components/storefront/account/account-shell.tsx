'use client';

// HamzaPhone Authenticated Customer Dashboard Shell

import React from 'react';
import { User, Building2, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import type { CustomerContext } from '@/lib/services/customer-account.service';
import { StorefrontShell } from '@/components/storefront/layout/storefront-shell';
import { AccountSidebar } from './account-sidebar';

interface AccountShellProps {
  children: React.ReactNode;
  context: CustomerContext;
  pageTitle?: string;
  pageSubtitle?: string;
}

export function AccountShell({
  children,
  context,
  pageTitle,
  pageSubtitle,
}: AccountShellProps) {
  return (
    <StorefrontShell>
      <div className="space-y-6">
        
        {/* Customer Header Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Avatar & User Info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-orange-500/20 shrink-0">
                {context.fullName ? context.fullName.slice(0, 2).toUpperCase() : 'HP'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    {context.fullName || 'Mon Compte HamzaPhone'}
                  </h1>
                  
                  {/* Account Badge */}
                  {context.isB2B ? (
                    context.b2bStatus === 'APPROVED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Grossiste B2B ({context.business?.tierCode || 'Tier 1'})</span>
                      </span>
                    ) : context.b2bStatus === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dossier B2B en cours</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        <span>B2B {context.b2bStatus}</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      <span>Compte Particulier</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  {context.email} {context.phone ? `• ${context.phone}` : ''}
                </p>
              </div>
            </div>

            {/* Quick Summary Pill */}
            {context.business && (
              <div className="sm:text-right text-xs bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-gray-100">
                <span className="text-gray-400 font-medium block text-[11px]">Établissement</span>
                <strong className="text-gray-800 font-bold">{context.business.name}</strong>
                <span className="text-gray-500 block text-[11px] font-mono">
                  RC: {context.business.rcNumber || '—'}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex flex-col lg:flex-row items-start gap-6">
          <AccountSidebar context={context} />
          
          <main className="flex-1 w-full min-w-0">
            {children}
          </main>
        </div>

      </div>
    </StorefrontShell>
  );
}
