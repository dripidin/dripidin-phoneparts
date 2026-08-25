// HamzaPhone Staff & Role Management Domain Types

import type { AppRoleCode } from './rbac.types';

export interface StaffUserSummary {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: AppRoleCode | string;
  roleName: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  permissionsCount: number;
}

export interface StaffUserDetail extends StaffUserSummary {
  permissions: string[];
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    timestamp: string;
    details?: string;
  }>;
}

export type PermissionDomain =
  | 'CATALOG'
  | 'PRICING'
  | 'INVENTORY'
  | 'ORDERS'
  | 'PAYMENTS'
  | 'DELIVERY'
  | 'CUSTOMERS_B2B'
  | 'SUPPLIERS'
  | 'IMPORTS_EXPORTS'
  | 'CMS'
  | 'NOTIFICATIONS'
  | 'ANALYTICS_REPORTS'
  | 'ADMIN_SECURITY'
  | 'SYSTEM_SETTINGS';

export interface PermissionItem {
  code: string;
  resource: string;
  action: string;
  labelFr: string;
  descriptionFr: string;
  domain: PermissionDomain;
}

export interface RoleDetail {
  id: string;
  code: AppRoleCode | string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  email: string;
  fullName: string;
  phone?: string | null;
  roleCode: AppRoleCode | string;
  isActive?: boolean;
}

export interface UpdateStaffInput {
  fullName?: string;
  phone?: string | null;
  roleCode?: AppRoleCode | string;
  isActive?: boolean;
}

export interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
  permissionCodes: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionCodes: string[];
}
