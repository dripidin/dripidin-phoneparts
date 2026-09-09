// Admin Sidebar Navigation for HamzaPhone with 21 Core Modules

import React from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  FolderTree,
  Tags,
  Boxes,
  Truck,
  Users,
  Briefcase,
  Percent,
  FileSpreadsheet,
  PackageCheck,
  CreditCard,
  BarChart3,
  Bell,
  UserCheck,
  ShieldCheck,
  History,
  Trash2,
  Globe,
  Settings,
  ChevronRight,
  Zap,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'orders'
  | 'products'
  | 'categories'
  | 'brands'
  | 'inventory'
  | 'suppliers'
  | 'customers'
  | 'b2b'
  | 'pricing'
  | 'import-export'
  | 'delivery'
  | 'payments'
  | 'analytics'
  | 'notifications'
  | 'users'
  | 'roles-permissions'
  | 'activity-logs'
  | 'trash'
  | 'website-settings'
  | 'system-settings'
  | 'integrations';

export interface AdminSidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  pendingB2BCount?: number;
  lowStockCount?: number;
  pendingOrdersCount?: number;
}

export function AdminSidebar({
  activeTab,
  onSelectTab,
  pendingB2BCount = 1,
  lowStockCount = 2,
  pendingOrdersCount = 1,
}: AdminSidebarProps) {
  const navigationGroups = [
    {
      group: 'Commerce & Ventes',
      items: [
        { id: 'overview' as AdminTab, label: 'Tableau de bord', icon: LayoutDashboard },
        {
          id: 'orders' as AdminTab,
          label: 'Commandes',
          icon: ShoppingCart,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined,
          badgeColor: 'bg-orange-500 text-white',
        },
        { id: 'payments' as AdminTab, label: 'Paiements & COD', icon: CreditCard },
        { id: 'delivery' as AdminTab, label: 'Livraison EcoTrack', icon: PackageCheck },
      ],
    },
    {
      group: 'Catalogue & Stock',
      items: [
        { id: 'products' as AdminTab, label: 'Pièces & Produits', icon: Smartphone },
        { id: 'categories' as AdminTab, label: 'Catégories', icon: FolderTree },
        { id: 'brands' as AdminTab, label: 'Marques & Modèles', icon: Tags },
        {
          id: 'inventory' as AdminTab,
          label: 'Stock & Entrepôt',
          icon: Boxes,
          badge: lowStockCount > 0 ? lowStockCount : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        { id: 'pricing' as AdminTab, label: 'Tarification & Lots', icon: Percent },
        { id: 'suppliers' as AdminTab, label: 'Fournisseurs', icon: Truck },
        { id: 'import-export' as AdminTab, label: 'Import / Export', icon: FileSpreadsheet },
      ],
    },
    {
      group: 'Clients & B2B',
      items: [
        { id: 'customers' as AdminTab, label: 'Clients B2C', icon: Users },
        {
          id: 'b2b' as AdminTab,
          label: 'Comptes Pros B2B',
          icon: Briefcase,
          badge: pendingB2BCount > 0 ? pendingB2BCount : undefined,
          badgeColor: 'bg-blue-600 text-white',
        },
      ],
    },
    {
      group: 'Administration & Contrôle',
      items: [
        { id: 'analytics' as AdminTab, label: 'Statistiques & Rapports', icon: BarChart3 },
        { id: 'notifications' as AdminTab, label: 'Notifications SMS/WA', icon: Bell },
        { id: 'users' as AdminTab, label: 'Utilisateurs Staff', icon: UserCheck },
        { id: 'roles-permissions' as AdminTab, label: 'Rôles & Permissions', icon: ShieldCheck },
        { id: 'activity-logs' as AdminTab, label: 'Journal d\'Audit', icon: History },
        { id: 'trash' as AdminTab, label: 'Corbeille & Archives', icon: Trash2 },
        { id: 'integrations' as AdminTab, label: 'Centre Intégrations', icon: Zap },
        { id: 'website-settings' as AdminTab, label: 'Contenu Site Web', icon: Globe },
        { id: 'system-settings' as AdminTab, label: 'Paramètres Système', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
          DRP
        </div>
        <div>
          <span className="font-bold text-gray-900 tracking-tight block leading-tight">DRIPIDIN</span>
          <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider block">Admin Suite DZ</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((grp) => (
          <div key={grp.group} className="space-y-1">
            <h4 className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {grp.group}
            </h4>
            {grp.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer',
                    isActive
                      ? 'bg-orange-50 text-orange-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none',
                          item.badgeColor || 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-600" />}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Profile Status */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/70">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-[11px] text-gray-500 truncate">
            Serveur Alger <span className="font-semibold text-gray-700">En ligne</span> (EcoTrack Sync)
          </div>
        </div>
      </div>
    </aside>
  );
}
