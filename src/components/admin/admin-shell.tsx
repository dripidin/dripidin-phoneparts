'use client';

// Admin Shell Layout and Master Router for HamzaPhone

import React, { useState, useEffect } from 'react';
import { AdminSidebar, type AdminTab } from './admin-sidebar';
import { AdminHeader } from './admin-header';
import { adminStore } from '@/lib/admin-store';
import { useDashboardOverview } from '@/lib/hooks/use-admin-queries';
import type { AppRoleCode } from '@/types/rbac.types';

// Views
import { OverviewView } from './views/overview-view';
import { ProductsView } from './views/products-view';
import { PricingView } from './views/pricing-view';
import { InventoryView } from './views/inventory-view';
import { OrdersView } from './views/orders-view';
import { CustomersView } from './views/customers-view';
import { CategoriesView, BrandsView } from './views/categories-view';
import { SuppliersView } from './views/suppliers-view';
import { ImportExportView } from './views/import-export-view';
import { RolesPermissionsView } from './views/roles-permissions-view';
import { ActivityLogsView } from './views/activity-logs-view';
import { TrashView } from './views/trash-view';
import { DeliveryView } from './views/delivery-view';
import { PaymentsView } from './views/payments-view';
import { AnalyticsView } from './views/analytics-view';
import { NotificationsView } from './views/notifications-view';
import { UsersView } from './views/users-view';
import { WebsiteSettingsView, SystemSettingsView } from './views/website-settings-view';

export function AdminShell() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [currentRole, setCurrentRole] = useState<AppRoleCode>(() => adminStore.getCurrentRole());

  const { data: overviewData } = useDashboardOverview();

  const lowStockCount = overviewData?.metrics.lowStockProducts ?? 0;
  const pendingOrdersCount = overviewData?.metrics.pendingOrders ?? 0;
  const pendingB2BCount = overviewData?.metrics.b2bCustomersCount ?? 0;

  const handleRoleChange = (role: AppRoleCode) => {
    adminStore.setCurrentRole(role);
    setCurrentRole(role);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans antialiased">
      {/* 21-Item Navigation Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingB2BCount={pendingB2BCount}
        lowStockCount={lowStockCount}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Main Operational Workstation */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header & Role Simulator */}
        <AdminHeader
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          lowStockCount={lowStockCount}
        />

        {/* View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && <OverviewView onNavigate={setActiveTab} />}
            {activeTab === 'orders' && <OrdersView />}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'categories' && <CategoriesView />}
            {activeTab === 'brands' && <BrandsView />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'suppliers' && <SuppliersView />}
            {activeTab === 'customers' && <CustomersView initialTab="b2c" />}
            {activeTab === 'b2b' && <CustomersView initialTab="b2b" />}
            {activeTab === 'pricing' && <PricingView />}
            {activeTab === 'import-export' && <ImportExportView />}
            {activeTab === 'delivery' && <DeliveryView />}
            {activeTab === 'payments' && <PaymentsView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'notifications' && <NotificationsView />}
            {activeTab === 'users' && <UsersView />}
            {activeTab === 'roles-permissions' && <RolesPermissionsView />}
            {activeTab === 'activity-logs' && <ActivityLogsView />}
            {activeTab === 'trash' && <TrashView />}
            {activeTab === 'website-settings' && <WebsiteSettingsView />}
            {activeTab === 'system-settings' && <SystemSettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
}
