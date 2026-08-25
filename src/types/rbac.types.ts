// System Roles, Granular Permissions and Authorization Types for HamzaPhone

export type AppRoleCode =
  | 'OWNER'
  | 'ADMINISTRATOR'
  | 'SALES_MANAGER'
  | 'ORDER_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'CONTENT_MANAGER'
  | 'SUPPORT'
  | 'VIEWER'
  | 'B2B_CUSTOMER'
  | 'B2C_CUSTOMER';

export const APP_PERMISSIONS = {
  // Superuser
  ALL: 'all',

  // Products & Catalog
  PRODUCTS_READ: 'products.read',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_UPDATE: 'products.update',
  PRODUCTS_DELETE: 'products.delete',
  PRODUCTS_IMPORT: 'products.import',
  PRODUCTS_EXPORT: 'products.export',
  PRODUCTS_BULK_UPDATE: 'products.bulk_update',
  CATEGORIES_MANAGE: 'categories.manage',
  BRANDS_MANAGE: 'brands.manage',

  // Pricing
  PRICING_READ: 'pricing.read',
  PRICING_UPDATE: 'pricing.update',
  PRICING_BULK_PERCENTAGE: 'pricing.bulk_percentage',
  PRICING_B2B_TIERS: 'pricing.b2b_tiers',
  PRICING_CUSTOMER_OVERRIDE: 'pricing.customer_override',

  // Inventory & Warehouse
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_RECEIVE: 'inventory.receive',

  // Orders & Logistics
  ORDERS_READ: 'orders.read',
  ORDERS_CREATE: 'orders.create',
  ORDERS_UPDATE: 'orders.update',
  ORDERS_CANCEL: 'orders.cancel',
  ORDERS_REFUND: 'orders.refund',
  DELIVERY_DISPATCH: 'delivery.dispatch',
  DELIVERY_MANAGE_RATES: 'delivery.manage_rates',

  // Imports & Exports
  IMPORTS_READ: 'imports.read',
  IMPORTS_CREATE: 'imports.create',
  IMPORTS_APPLY: 'imports.apply',
  IMPORTS_CANCEL: 'imports.cancel',
  IMPORTS_EXPORT: 'imports.export',

  // Suppliers
  SUPPLIERS_READ: 'suppliers.read',
  SUPPLIERS_CREATE: 'suppliers.create',
  SUPPLIERS_UPDATE: 'suppliers.update',
  SUPPLIERS_DELETE: 'suppliers.delete',

  // Pricing & Inventory Extensions
  PRICING_IMPORT: 'pricing.import',
  INVENTORY_IMPORT: 'inventory.import',
  INVENTORY_EXPORT: 'inventory.export',

  // B2B & Customers
  CUSTOMERS_READ: 'customers.read',
  CUSTOMERS_UPDATE: 'customers.update',
  B2B_READ: 'b2b.read',
  B2B_APPROVE: 'b2b.approve',
  B2B_MANAGE_PRICING: 'b2b.manage_pricing',

  // Payments & COD Reconciliation
  PAYMENTS_READ: 'payments.read',
  PAYMENTS_MANAGE: 'payments.manage',
  PAYMENTS_RECONCILE: 'payments.reconcile',
  PAYMENTS_ADJUST: 'payments.adjust',

  // Analytics & Reporting
  ANALYTICS_READ: 'analytics.read',
  REPORTS_READ: 'reports.read',
  REPORTS_EXPORT: 'reports.export',

  // Administration, CMS & Governance
  USERS_MANAGE: 'users.manage',
  SETTINGS_READ: 'settings.read',
  SETTINGS_MANAGE: 'settings.manage',
  CMS_READ: 'cms.read',
  CMS_MANAGE: 'cms.manage',
  NOTIFICATIONS_READ: 'notifications.read',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
  AUDIT_READ: 'audit.read',
} as const;

export type AppPermissionCode = (typeof APP_PERMISSIONS)[keyof typeof APP_PERMISSIONS];

export interface UserAuthContext {
  userId: string;
  email: string;
  userType: 'B2C' | 'B2B' | 'STAFF';
  role: AppRoleCode;
  permissions: Set<string>;
  businessId?: string | null;
  isActive: boolean;
}
