'use client';

// HamzaPhone Account Sidebar & Mobile Tab Navigation

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  MapPin, 
  Package, 
  ShieldCheck, 
  Building2, 
  Sparkles, 
  LogOut, 
  Loader2 
} from 'lucide-react';
import type { CustomerContext } from '@/lib/services/customer-account.service';
import { useCustomerMutations } from '@/lib/hooks/use-customer-account';

interface AccountSidebarProps {
  context: CustomerContext;
}

export function AccountSidebar({ context }: AccountSidebarProps) {
  const pathname = usePathname();
  const { logout } = useCustomerMutations();

  const navItems = [
    { label: 'Aperçu', href: '/account', icon: LayoutDashboard },
    { label: 'Mon Profil', href: '/account/profile', icon: User },
    { label: 'Mes Adresses', href: '/account/addresses', icon: MapPin },
    { label: 'Mes Commandes', href: '/account/orders', icon: Package },
    { label: 'Sécurité & Accès', href: '/account/settings', icon: ShieldCheck },
  ];

  // B2B specific tabs
  if (context.isB2B) {
    navItems.push({
      label: 'Espace Entreprise B2B',
      href: '/account/business',
      icon: Building2,
    });

    if (context.canAccessWholesalePrices) {
      navItems.push({
        label: 'Tarifs Grossiste B2B',
        href: '/account/business/pricing',
        icon: Sparkles,
      });
    }
  }

  return (
    <>
      {/* 1. Mobile Horizontal Scroll Tabs */}
      <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 2. Desktop Vertical Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-3xl border border-gray-200/80 p-4 shadow-2xs space-y-2">
        <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
          Navigation Compte
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 border border-orange-200 shadow-2xs'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            {logout.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  );
}
