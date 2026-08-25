// Admin Top Header with Role Selector, Global Search, and Notifications

import React from 'react';
import { Search, Bell, Shield, AlertTriangle } from 'lucide-react';
import type { AppRoleCode } from '@/types/rbac.types';
import { adminStore } from '@/lib/admin-store';
import { Badge } from '@/components/ui/badge';

export interface AdminHeaderProps {
  currentRole: AppRoleCode;
  onRoleChange: (role: AppRoleCode) => void;
  onOpenSearch?: () => void;
  lowStockCount?: number;
}

export function AdminHeader({ currentRole, onRoleChange, lowStockCount = 0 }: AdminHeaderProps) {
  const rolesList: { code: AppRoleCode; label: string }[] = [
    { code: 'OWNER', label: 'Propriétaire (Superadmin)' },
    { code: 'ADMINISTRATOR', label: 'Administrateur Général' },
    { code: 'SALES_MANAGER', label: 'Responsable Commercial / B2B' },
    { code: 'ORDER_MANAGER', label: 'Gestionnaire Commandes / Expédition' },
    { code: 'INVENTORY_MANAGER', label: 'Gestionnaire Stock / Entrepôt' },
    { code: 'CONTENT_MANAGER', label: 'Gestionnaire Catalogue / Contenu' },
    { code: 'SUPPORT', label: 'Service Client Support' },
    { code: 'VIEWER', label: 'Auditeur / Lecteur Seul' },
  ];

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input Bar */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Recherche rapide (SKU, N° Commande, Client, Code-barres)..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Right Controls & Role Switcher */}
      <div className="flex items-center gap-4">
        {/* Low stock alert flag */}
        {lowStockCount > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{lowStockCount} articles en stock critique</span>
          </div>
        )}

        {/* Role Simulator Switcher */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          <Shield className="w-3.5 h-3.5 text-orange-600" />
          <span className="text-[11px] font-semibold text-gray-500 uppercase">Rôle Actif:</span>
          <select
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as AppRoleCode)}
            className="text-xs font-bold text-gray-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {rolesList.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-600" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-orange-700 font-bold text-xs flex items-center justify-center">
            HP
          </div>
          <div className="hidden md:block text-left leading-tight">
            <span className="text-xs font-semibold text-gray-900 block">{adminStore.getCurrentEmail()}</span>
            <Badge variant="orange" className="text-[9px] px-1.5 py-0">
              {currentRole}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
